using System.Linq.Expressions;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SkillHireAI.API.Data;
using SkillHireAI.API.DTOs.Applications;
using SkillHireAI.API.DTOs.Interviews;
using SkillHireAI.API.Middleware;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

/// <summary>
/// A candidate's own applications. Every query is filtered by the logged-in
/// candidate, so other candidates' applications behave as if they don't exist (404).
/// </summary>
public class CandidateApplicationService : ICandidateApplicationService
{
    private readonly ApplicationDbContext _db;

    public CandidateApplicationService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<CandidateApplicationDto> ApplyAsync(int userId, CreateApplicationDto request)
    {
        var candidate = await _db.Candidates.SingleOrDefaultAsync(c => c.UserId == userId)
            ?? throw AppException.NotFound("Candidate profile not found.");

        var job = await _db.Jobs
            .Where(j => j.Id == request.JobId)
            .Select(j => new { j.Id, j.Status })
            .SingleOrDefaultAsync();

        // Jobs that were never approved are hidden from candidates entirely.
        if (job is null || job.Status is JobStatus.Pending or JobStatus.Rejected)
        {
            throw AppException.NotFound("Job not found.");
        }

        if (job.Status == JobStatus.Closed)
        {
            throw AppException.Conflict("This job is closed and no longer accepts applications.");
        }

        if (!ApplicationQueries.HasResume(candidate))
        {
            throw new AppException("Upload a resume or add a resume link to your profile before applying.");
        }

        if (await _db.Applications.AnyAsync(a => a.JobId == job.Id && a.CandidateId == candidate.Id))
        {
            throw AppException.Conflict("You have already applied for this job.");
        }

        var application = new Application
        {
            JobId = job.Id,
            CandidateId = candidate.Id,
            CoverLetter = Clean(request.CoverLetter),
            Status = ApplicationStatus.Applied,
            AppliedAt = DateTime.UtcNow
        };
        _db.Applications.Add(application);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            // Two requests at the same moment: the unique (JobId, CandidateId) index stopped the second one.
            throw AppException.Conflict("You have already applied for this job.");
        }

        return await GetDtoAsync(candidate.Id, application.Id);
    }

    public async Task<List<CandidateApplicationDto>> GetMyApplicationsAsync(int userId, ApplicationStatus? status)
    {
        var candidateId = await _db.GetCandidateIdAsync(userId);
        var query = _db.Applications.Where(a => a.CandidateId == candidateId);

        if (status.HasValue)
        {
            query = query.Where(a => a.Status == status.Value);
        }

        var applications = await query
            .OrderByDescending(a => a.AppliedAt)
            .Select(ToDto)
            .ToListAsync();

        return await WithInterviewsAsync(applications);
    }

    public async Task<CandidateApplicationDto> GetMyApplicationAsync(int userId, int applicationId)
    {
        var candidateId = await _db.GetCandidateIdAsync(userId);
        return await GetDtoAsync(candidateId, applicationId);
    }

    public async Task<CandidateApplicationDto> UpdateAsync(int userId, int applicationId, UpdateApplicationDto request)
    {
        var application = await GetOwnApplicationAsync(userId, applicationId);

        if (application.Status != ApplicationStatus.Applied)
        {
            throw AppException.Conflict("The cover letter can only be changed before the employer reviews your application.");
        }

        application.CoverLetter = Clean(request.CoverLetter);
        application.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await GetDtoAsync(application.CandidateId, application.Id);
    }

    public async Task WithdrawAsync(int userId, int applicationId)
    {
        var application = await GetOwnApplicationAsync(userId, applicationId);

        if (application.Status != ApplicationStatus.Applied)
        {
            throw AppException.Conflict("Applications can only be withdrawn before the employer reviews them.");
        }

        _db.Applications.Remove(application);
        await _db.SaveChangesAsync();
    }

    public async Task<List<InterviewDto>> GetMyInterviewsAsync(int userId, bool upcomingOnly)
    {
        var candidateId = await _db.GetCandidateIdAsync(userId);
        var query = _db.Interviews.Where(i => i.Application.CandidateId == candidateId);

        if (upcomingOnly)
        {
            var now = DateTime.UtcNow;
            query = query.Where(i => i.Status == InterviewStatus.Scheduled && i.InterviewDate >= now);
        }

        var interviews = await query
            .OrderByDescending(i => i.InterviewDate)
            .Select(ApplicationQueries.ToInterviewDto)
            .ToListAsync();

        return interviews.Select(i => i.ForCandidate()).ToList();
    }

    public async Task<List<CandidateApplicationDto>> GetRecentForCandidateAsync(int candidateId, int count)
    {
        var applications = await _db.Applications
            .Where(a => a.CandidateId == candidateId)
            .OrderByDescending(a => a.UpdatedAt ?? a.AppliedAt)
            .Take(count)
            .Select(ToDto)
            .ToListAsync();

        return await WithInterviewsAsync(applications);
    }

    public async Task<List<InterviewDto>> GetUpcomingInterviewsForCandidateAsync(int candidateId, int count)
    {
        var now = DateTime.UtcNow;
        var interviews = await _db.Interviews
            .Where(i => i.Application.CandidateId == candidateId &&
                        i.Status == InterviewStatus.Scheduled &&
                        i.InterviewDate >= now)
            .OrderBy(i => i.InterviewDate)
            .Take(count)
            .Select(ApplicationQueries.ToInterviewDto)
            .ToListAsync();

        return interviews.Select(i => i.ForCandidate()).ToList();
    }

    private static readonly Expression<Func<Application, CandidateApplicationDto>> ToDto = a => new CandidateApplicationDto
    {
        Id = a.Id,
        JobId = a.JobId,
        JobTitle = a.Job.Title,
        CompanyName = a.Job.Employer.CompanyName,
        CompanyLogoUrl = a.Job.Employer.LogoUrl,
        JobLocation = a.Job.Location,
        JobStatus = a.Job.Status,
        CoverLetter = a.CoverLetter,
        Status = a.Status,
        AppliedAt = a.AppliedAt,
        UpdatedAt = a.UpdatedAt
    };

    private async Task<CandidateApplicationDto> GetDtoAsync(int candidateId, int applicationId)
    {
        var application = await _db.Applications
            .Where(a => a.Id == applicationId && a.CandidateId == candidateId)
            .Select(ToDto)
            .SingleOrDefaultAsync()
            ?? throw ApplicationNotFound();

        return (await WithInterviewsAsync([application]))[0];
    }

    private async Task<List<CandidateApplicationDto>> WithInterviewsAsync(List<CandidateApplicationDto> applications)
    {
        var interviews = await _db.Interviews.GetInterviewsByApplicationAsync(applications.Select(a => a.Id).ToList());

        foreach (var application in applications)
        {
            application.Interviews = interviews.GetValueOrDefault(application.Id, [])
                .Select(i => i.ForCandidate())
                .ToList();
        }

        return applications;
    }

    private async Task<Application> GetOwnApplicationAsync(int userId, int applicationId)
    {
        var candidateId = await _db.GetCandidateIdAsync(userId);
        return await _db.Applications.SingleOrDefaultAsync(a => a.Id == applicationId && a.CandidateId == candidateId)
            ?? throw ApplicationNotFound();
    }

    private static AppException ApplicationNotFound() => AppException.NotFound("Application not found.");

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
