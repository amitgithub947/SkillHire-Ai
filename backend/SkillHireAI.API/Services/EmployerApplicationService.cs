using Microsoft.EntityFrameworkCore;
using SkillHireAI.API.Data;
using SkillHireAI.API.DTOs.Applications;
using SkillHireAI.API.DTOs.Interviews;
using SkillHireAI.API.Middleware;
using SkillHireAI.API.Models;
using SkillHireAI.API.Services.Email;

namespace SkillHireAI.API.Services;

/// <summary>
/// Applications to the logged-in employer's jobs. Applications for other
/// employers' jobs return 404, so their existence isn't revealed.
/// </summary>
public class EmployerApplicationService : IEmployerApplicationService
{
    // Which statuses each action is allowed from. Selected and Rejected are final.
    private static readonly ApplicationStatus[] CanShortlist = [ApplicationStatus.Applied];

    private static readonly ApplicationStatus[] CanReject =
        [ApplicationStatus.Applied, ApplicationStatus.Shortlisted, ApplicationStatus.InterviewScheduled];

    private static readonly ApplicationStatus[] CanSelect =
        [ApplicationStatus.Shortlisted, ApplicationStatus.InterviewScheduled];

    private static readonly ApplicationStatus[] CanSchedule =
        [ApplicationStatus.Applied, ApplicationStatus.Shortlisted, ApplicationStatus.InterviewScheduled];

    private readonly ApplicationDbContext _db;
    private readonly IResumeStorage _resumes;
    private readonly IInterviewNotifier _notifier;

    public EmployerApplicationService(ApplicationDbContext db, IResumeStorage resumes, IInterviewNotifier notifier)
    {
        _db = db;
        _resumes = resumes;
        _notifier = notifier;
    }

    public async Task<List<EmployerApplicationDto>> GetApplicationsAsync(
        int userId, int? jobId, ApplicationStatus? status, string? search)
    {
        var query = await MyApplicationsAsync(userId);

        if (jobId.HasValue)
        {
            query = query.Where(a => a.JobId == jobId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(a => a.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(a =>
                a.Candidate.User.Name.Contains(term) ||
                a.Candidate.User.Email.Contains(term) ||
                (a.Candidate.Skills != null && a.Candidate.Skills.Contains(term)) ||
                a.Job.Title.Contains(term));
        }

        var rows = await Project(query.OrderByDescending(a => a.AppliedAt)).ToListAsync();
        return rows.Select(r => Fill(r, new EmployerApplicationDto())).ToList();
    }

    public async Task<EmployerApplicationDetailsDto> GetApplicationAsync(int userId, int applicationId)
    {
        var employerId = await _db.GetEmployerIdAsync(userId);
        return await GetDetailsAsync(employerId, applicationId);
    }

    public async Task<ResumeFile> GetResumeAsync(int userId, int applicationId)
    {
        var application = await GetOwnApplicationAsync(userId, applicationId, includeCandidate: true);
        return CandidateService.OpenResume(_resumes, application.Candidate);
    }

    public Task<EmployerApplicationDetailsDto> ShortlistAsync(int userId, int applicationId) =>
        ChangeStatusAsync(userId, applicationId, ApplicationStatus.Shortlisted, CanShortlist, "shortlist");

    public Task<EmployerApplicationDetailsDto> SelectAsync(int userId, int applicationId) =>
        ChangeStatusAsync(userId, applicationId, ApplicationStatus.Selected, CanSelect, "select");

    public async Task<EmployerApplicationDetailsDto> RejectAsync(int userId, int applicationId)
    {
        var application = await GetOwnApplicationAsync(userId, applicationId);
        EnsureAllowed(application, CanReject, "reject");

        // A rejected candidate shouldn't still have interviews on their calendar.
        var scheduled = await _db.Interviews
            .Where(i => i.ApplicationId == application.Id && i.Status == InterviewStatus.Scheduled)
            .ToListAsync();
        scheduled.ForEach(i => i.Status = InterviewStatus.Cancelled);

        application.Status = ApplicationStatus.Rejected;
        application.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await GetDetailsAsync(application.Job.EmployerId, application.Id);
    }

    public async Task<InterviewDto> ScheduleInterviewAsync(int userId, int applicationId, ScheduleInterviewDto request)
    {
        var application = await GetOwnApplicationAsync(userId, applicationId);
        EnsureAllowed(application, CanSchedule, "schedule an interview for");

        if (await _db.Interviews.AnyAsync(i => i.ApplicationId == application.Id && i.Status == InterviewStatus.Scheduled))
        {
            throw AppException.Conflict("This candidate already has a scheduled interview. Complete or cancel it first.");
        }

        var interview = new Interview
        {
            ApplicationId = application.Id,
            InterviewDate = request.InterviewDate!.Value.UtcDateTime,
            Type = request.Type!.Value,
            MeetingLink = Clean(request.MeetingLink),
            Notes = Clean(request.Notes),
            Status = InterviewStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };
        _db.Interviews.Add(interview);

        application.Status = ApplicationStatus.InterviewScheduled;
        application.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var dto = await GetInterviewDtoAsync(interview.Id);
        dto.CandidateNotified = await _notifier.SendScheduledAsync(interview.Id);
        return dto;
    }

    public async Task<InterviewDto> UpdateInterviewStatusAsync(int userId, int interviewId, UpdateInterviewStatusDto request)
    {
        if (request.Status is not (InterviewStatus.Completed or InterviewStatus.Cancelled))
        {
            throw new AppException("Status must be Completed or Cancelled.");
        }

        var employerId = await _db.GetEmployerIdAsync(userId);
        var interview = await _db.Interviews
            .Include(i => i.Application)
            .SingleOrDefaultAsync(i => i.Id == interviewId && i.Application.Job.EmployerId == employerId)
            ?? throw AppException.NotFound("Interview not found.");

        if (interview.Status != InterviewStatus.Scheduled)
        {
            throw AppException.Conflict($"This interview is already {interview.Status.ToString().ToLowerInvariant()}.");
        }

        interview.Status = request.Status.Value;
        interview.Feedback = Clean(request.Feedback);

        // With its only interview cancelled, the candidate goes back to the shortlist.
        var application = interview.Application;
        if (interview.Status == InterviewStatus.Cancelled &&
            application.Status == ApplicationStatus.InterviewScheduled &&
            !await _db.Interviews.AnyAsync(i => i.ApplicationId == application.Id &&
                                                i.Id != interview.Id &&
                                                i.Status != InterviewStatus.Cancelled))
        {
            application.Status = ApplicationStatus.Shortlisted;
        }

        application.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var dto = await GetInterviewDtoAsync(interview.Id);
        if (interview.Status == InterviewStatus.Cancelled)
        {
            dto.CandidateNotified = await _notifier.SendCancelledAsync(interview.Id);
        }
        return dto;
    }

    public async Task<List<InterviewDto>> GetInterviewsAsync(int userId, bool upcomingOnly)
    {
        var employerId = await _db.GetEmployerIdAsync(userId);
        var query = _db.Interviews.Where(i => i.Application.Job.EmployerId == employerId);

        if (upcomingOnly)
        {
            var now = DateTime.UtcNow;
            query = query
                .Where(i => i.Status == InterviewStatus.Scheduled && i.InterviewDate >= now)
                .OrderBy(i => i.InterviewDate);
        }
        else
        {
            query = query.OrderByDescending(i => i.InterviewDate);
        }

        return await query.Select(ApplicationQueries.ToInterviewDto).ToListAsync();
    }

    private async Task<EmployerApplicationDetailsDto> ChangeStatusAsync(
        int userId, int applicationId, ApplicationStatus target, ApplicationStatus[] allowedFrom, string action)
    {
        var application = await GetOwnApplicationAsync(userId, applicationId);
        EnsureAllowed(application, allowedFrom, action);

        application.Status = target;
        application.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await GetDetailsAsync(application.Job.EmployerId, application.Id);
    }

    private static void EnsureAllowed(Application application, ApplicationStatus[] allowedFrom, string action)
    {
        if (!allowedFrom.Contains(application.Status))
        {
            throw AppException.Conflict($"You cannot {action} an application that is {Describe(application.Status)}.");
        }
    }

    private static string Describe(ApplicationStatus status) => status switch
    {
        ApplicationStatus.InterviewScheduled => "in the interview stage",
        _ => status.ToString().ToLowerInvariant()
    };

    private async Task<IQueryable<Application>> MyApplicationsAsync(int userId)
    {
        var employerId = await _db.GetEmployerIdAsync(userId);
        return _db.Applications.Where(a => a.Job.EmployerId == employerId);
    }

    private async Task<Application> GetOwnApplicationAsync(int userId, int applicationId, bool includeCandidate = false)
    {
        var employerId = await _db.GetEmployerIdAsync(userId);
        var query = _db.Applications.Include(a => a.Job).AsQueryable();

        if (includeCandidate)
        {
            query = query.Include(a => a.Candidate);
        }

        return await query.SingleOrDefaultAsync(a => a.Id == applicationId && a.Job.EmployerId == employerId)
            ?? throw ApplicationNotFound();
    }

    private async Task<EmployerApplicationDetailsDto> GetDetailsAsync(int employerId, int applicationId)
    {
        var row = await Project(_db.Applications.Where(a => a.Id == applicationId && a.Job.EmployerId == employerId))
            .SingleOrDefaultAsync()
            ?? throw ApplicationNotFound();

        var interviews = await _db.Interviews.GetInterviewsByApplicationAsync([applicationId]);

        var details = Fill(row, new EmployerApplicationDetailsDto());
        details.CoverLetter = row.CoverLetter;
        details.JobStatus = row.JobStatus;
        details.JobSkills = row.JobSkills;
        details.CandidatePhone = row.CandidatePhone;
        details.CandidateExperience = row.CandidateExperience;
        details.ResumeUrl = row.ResumeUrl;
        details.ResumeFileName = row.ResumeFileName;
        details.Interviews = interviews.GetValueOrDefault(applicationId, []);
        return details;
    }

    private Task<InterviewDto> GetInterviewDtoAsync(int interviewId) =>
        _db.Interviews.Where(i => i.Id == interviewId).Select(ApplicationQueries.ToInterviewDto).SingleAsync();

    private static IQueryable<ApplicationRow> Project(IQueryable<Application> applications)
    {
        var now = DateTime.UtcNow;
        return applications.Select(a => new ApplicationRow
        {
            Id = a.Id,
            JobId = a.JobId,
            JobTitle = a.Job.Title,
            JobStatus = a.Job.Status,
            JobSkills = a.Job.Skills,
            CandidateId = a.CandidateId,
            CandidateName = a.Candidate.User.Name,
            CandidateEmail = a.Candidate.User.Email,
            CandidatePhone = a.Candidate.Phone,
            CandidateLocation = a.Candidate.Location,
            CandidateExperienceYears = a.Candidate.ExperienceYears,
            CandidateExperience = a.Candidate.Experience,
            CandidateSkills = a.Candidate.Skills,
            ResumeUrl = a.Candidate.ResumeUrl,
            ResumeFileName = a.Candidate.ResumeFileName,
            HasResumeFile = a.Candidate.ResumeStoredName != null,
            CoverLetter = a.CoverLetter,
            Status = a.Status,
            AppliedAt = a.AppliedAt,
            UpdatedAt = a.UpdatedAt,
            NextInterviewAt = a.Interviews
                .Where(i => i.Status == InterviewStatus.Scheduled && i.InterviewDate >= now)
                .OrderBy(i => i.InterviewDate)
                .Select(i => (DateTime?)i.InterviewDate)
                .FirstOrDefault()
        });
    }

    private static T Fill<T>(ApplicationRow row, T dto) where T : EmployerApplicationDto
    {
        dto.Id = row.Id;
        dto.JobId = row.JobId;
        dto.JobTitle = row.JobTitle;
        dto.CandidateId = row.CandidateId;
        dto.CandidateName = row.CandidateName;
        dto.CandidateEmail = row.CandidateEmail;
        dto.CandidateLocation = row.CandidateLocation;
        dto.CandidateExperienceYears = row.CandidateExperienceYears;
        dto.CandidateSkills = SkillList.Parse(row.CandidateSkills);
        dto.HasResume = row.HasResumeFile || !string.IsNullOrWhiteSpace(row.ResumeUrl);
        dto.Status = row.Status;
        dto.AppliedAt = row.AppliedAt;
        dto.UpdatedAt = row.UpdatedAt;
        dto.NextInterviewAt = row.NextInterviewAt;
        return dto;
    }

    private static AppException ApplicationNotFound() => AppException.NotFound("Application not found.");

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private class ApplicationRow
    {
        public int Id { get; init; }
        public int JobId { get; init; }
        public string JobTitle { get; init; } = string.Empty;
        public JobStatus JobStatus { get; init; }
        public string? JobSkills { get; init; }
        public int CandidateId { get; init; }
        public string CandidateName { get; init; } = string.Empty;
        public string CandidateEmail { get; init; } = string.Empty;
        public string? CandidatePhone { get; init; }
        public string? CandidateLocation { get; init; }
        public int CandidateExperienceYears { get; init; }
        public string? CandidateExperience { get; init; }
        public string? CandidateSkills { get; init; }
        public string? ResumeUrl { get; init; }
        public string? ResumeFileName { get; init; }
        public bool HasResumeFile { get; init; }
        public string? CoverLetter { get; init; }
        public ApplicationStatus Status { get; init; }
        public DateTime AppliedAt { get; init; }
        public DateTime? UpdatedAt { get; init; }
        public DateTime? NextInterviewAt { get; init; }
    }
}
