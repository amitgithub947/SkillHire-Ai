using Microsoft.EntityFrameworkCore;
using SkillHireAI.API.Data;
using SkillHireAI.API.DTOs.Employers;
using SkillHireAI.API.Middleware;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

public class EmployerService : IEmployerService
{
    private readonly ApplicationDbContext _db;

    public EmployerService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<EmployerProfileDto> GetProfileAsync(int userId)
    {
        var employer = await GetEmployerAsync(userId);
        return ToProfileDto(employer);
    }

    public async Task<EmployerProfileDto> UpdateProfileAsync(int userId, UpdateEmployerProfileDto request)
    {
        var employer = await GetEmployerAsync(userId);

        employer.CompanyName = request.CompanyName.Trim();
        employer.CompanyDescription = Clean(request.CompanyDescription);
        employer.Location = Clean(request.Location);
        employer.Website = Clean(request.Website);
        employer.LogoUrl = Clean(request.LogoUrl);

        await _db.SaveChangesAsync();
        return ToProfileDto(employer);
    }

    public async Task<EmployerDashboardDto> GetDashboardAsync(int userId)
    {
        var employer = await GetEmployerAsync(userId);
        var myJobs = _db.Jobs.Where(j => j.EmployerId == employer.Id);
        var now = DateTime.UtcNow;

        return new EmployerDashboardDto
        {
            CompanyName = employer.CompanyName,
            ProfileComplete = IsComplete(employer),
            Jobs = await JobQueries.GetStatsAsync(myJobs),
            RecentJobs = await myJobs
                .OrderByDescending(j => j.CreatedAt)
                .Take(5)
                .Select(JobQueries.ToDto)
                .ToListAsync(),
            Applications = await ApplicationQueries.GetStatsAsync(
                _db.Applications.Where(a => a.Job.EmployerId == employer.Id)),
            UpcomingInterviews = await _db.Interviews
                .Where(i => i.Application.Job.EmployerId == employer.Id &&
                            i.Status == InterviewStatus.Scheduled &&
                            i.InterviewDate >= now)
                .OrderBy(i => i.InterviewDate)
                .Take(5)
                .Select(ApplicationQueries.ToInterviewDto)
                .ToListAsync()
        };
    }

    private async Task<Employer> GetEmployerAsync(int userId) =>
        await _db.Employers.Include(e => e.User).SingleOrDefaultAsync(e => e.UserId == userId)
        ?? throw AppException.NotFound("Employer profile not found.");

    private static EmployerProfileDto ToProfileDto(Employer employer) => new()
    {
        Id = employer.Id,
        CompanyName = employer.CompanyName,
        CompanyDescription = employer.CompanyDescription,
        Location = employer.Location,
        Website = employer.Website,
        LogoUrl = employer.LogoUrl,
        ContactName = employer.User.Name,
        ContactEmail = employer.User.Email,
        IsComplete = IsComplete(employer)
    };

    private static bool IsComplete(Employer employer) =>
        !string.IsNullOrWhiteSpace(employer.CompanyDescription) &&
        !string.IsNullOrWhiteSpace(employer.Location) &&
        !string.IsNullOrWhiteSpace(employer.Website);

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
