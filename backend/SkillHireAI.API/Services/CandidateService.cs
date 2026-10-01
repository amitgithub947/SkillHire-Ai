using Microsoft.EntityFrameworkCore;
using SkillHireAI.API.Data;
using SkillHireAI.API.DTOs.Candidates;
using SkillHireAI.API.Middleware;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

public class CandidateService : ICandidateService
{
    private readonly ApplicationDbContext _db;
    private readonly IResumeStorage _resumes;
    private readonly ICandidateJobService _jobs;
    private readonly ICandidateApplicationService _applications;

    public CandidateService(
        ApplicationDbContext db,
        IResumeStorage resumes,
        ICandidateJobService jobs,
        ICandidateApplicationService applications)
    {
        _db = db;
        _resumes = resumes;
        _jobs = jobs;
        _applications = applications;
    }

    public async Task<CandidateProfileDto> GetProfileAsync(int userId)
    {
        return ToProfileDto(await GetCandidateAsync(userId));
    }

    public async Task<CandidateProfileDto> UpdateProfileAsync(int userId, UpdateCandidateProfileDto request)
    {
        var candidate = await GetCandidateAsync(userId);

        candidate.Phone = Clean(request.Phone);
        candidate.Location = Clean(request.Location);
        candidate.Skills = SkillList.Normalize(request.Skills);
        candidate.ExperienceYears = request.ExperienceYears;
        candidate.Experience = Clean(request.Experience);
        candidate.ResumeUrl = Clean(request.ResumeUrl);

        await _db.SaveChangesAsync();
        return ToProfileDto(candidate);
    }

    public async Task<CandidateProfileDto> UploadResumeAsync(int userId, IFormFile file)
    {
        var candidate = await GetCandidateAsync(userId);
        var oldFile = candidate.ResumeStoredName;

        candidate.ResumeStoredName = await _resumes.SaveAsync(file);
        candidate.ResumeFileName = Path.GetFileName(file.FileName);
        candidate.ResumeUploadedAt = DateTime.UtcNow;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch
        {
            _resumes.Delete(candidate.ResumeStoredName);
            throw;
        }

        // Only remove the previous file once the new one is safely recorded.
        _resumes.Delete(oldFile);
        return ToProfileDto(candidate);
    }

    public async Task<CandidateProfileDto> DeleteResumeAsync(int userId)
    {
        var candidate = await GetCandidateAsync(userId);
        var oldFile = candidate.ResumeStoredName
            ?? throw AppException.NotFound("You have not uploaded a resume.");

        candidate.ResumeStoredName = null;
        candidate.ResumeFileName = null;
        candidate.ResumeUploadedAt = null;
        await _db.SaveChangesAsync();

        _resumes.Delete(oldFile);
        return ToProfileDto(candidate);
    }

    public async Task<ResumeFile> GetResumeAsync(int userId)
    {
        var candidate = await GetCandidateAsync(userId);
        return OpenResume(_resumes, candidate);
    }

    public async Task<CandidateDashboardDto> GetDashboardAsync(int userId)
    {
        var candidate = await GetCandidateAsync(userId);

        return new CandidateDashboardDto
        {
            Name = candidate.User.Name,
            ProfileComplete = IsComplete(candidate),
            HasResume = ApplicationQueries.HasResume(candidate),
            Applications = await ApplicationQueries.GetStatsAsync(_db.Applications.Where(a => a.CandidateId == candidate.Id)),
            UpcomingInterviews = await _applications.GetUpcomingInterviewsForCandidateAsync(candidate.Id, 5),
            RecentApplications = await _applications.GetRecentForCandidateAsync(candidate.Id, 5),
            LatestJobs = await _jobs.GetLatestNotAppliedAsync(candidate.Id, 5)
        };
    }

    /// <summary>Shared with the employer service, which opens the resume of an applicant.</summary>
    public static ResumeFile OpenResume(IResumeStorage storage, Candidate candidate)
    {
        if (string.IsNullOrEmpty(candidate.ResumeStoredName))
        {
            throw AppException.NotFound("No resume file has been uploaded.");
        }

        return storage.Open(candidate.ResumeStoredName, candidate.ResumeFileName ?? candidate.ResumeStoredName)
            ?? throw AppException.NotFound("The resume file could not be found.");
    }

    private async Task<Candidate> GetCandidateAsync(int userId) =>
        await _db.Candidates.Include(c => c.User).SingleOrDefaultAsync(c => c.UserId == userId)
        ?? throw AppException.NotFound("Candidate profile not found.");

    private static CandidateProfileDto ToProfileDto(Candidate candidate) => new()
    {
        Id = candidate.Id,
        Name = candidate.User.Name,
        Email = candidate.User.Email,
        Phone = candidate.Phone,
        Location = candidate.Location,
        Skills = SkillList.Parse(candidate.Skills),
        ExperienceYears = candidate.ExperienceYears,
        Experience = candidate.Experience,
        ResumeUrl = candidate.ResumeUrl,
        ResumeFileName = candidate.ResumeFileName,
        ResumeUploadedAt = candidate.ResumeUploadedAt,
        HasResume = ApplicationQueries.HasResume(candidate),
        IsComplete = IsComplete(candidate)
    };

    private static bool IsComplete(Candidate candidate) =>
        !string.IsNullOrWhiteSpace(candidate.Phone) &&
        !string.IsNullOrWhiteSpace(candidate.Location) &&
        !string.IsNullOrWhiteSpace(candidate.Skills) &&
        ApplicationQueries.HasResume(candidate);

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
