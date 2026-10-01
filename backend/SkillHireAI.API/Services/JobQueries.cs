using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SkillHireAI.API.DTOs.Jobs;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

/// <summary>Job queries shared by the employer and admin services.</summary>
public static class JobQueries
{
    /// <summary>Projection that EF Core translates to SQL, so only needed columns are read.</summary>
    public static readonly Expression<Func<Job, JobDto>> ToDto = j => new JobDto
    {
        Id = j.Id,
        EmployerId = j.EmployerId,
        CompanyName = j.Employer.CompanyName,
        CompanyLogoUrl = j.Employer.LogoUrl,
        Title = j.Title,
        Description = j.Description,
        Requirements = j.Requirements,
        Location = j.Location,
        SalaryMin = j.SalaryMin,
        SalaryMax = j.SalaryMax,
        ExperienceRequired = j.ExperienceRequired,
        Status = j.Status,
        RejectionReason = j.RejectionReason,
        CreatedAt = j.CreatedAt,
        UpdatedAt = j.UpdatedAt,
        ReviewedAt = j.ReviewedAt
    };

    public static async Task<JobStatsDto> GetStatsAsync(IQueryable<Job> jobs)
    {
        var counts = await jobs
            .GroupBy(j => j.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count);

        int CountOf(JobStatus status) => counts.GetValueOrDefault(status);

        return new JobStatsDto
        {
            Total = counts.Values.Sum(),
            Pending = CountOf(JobStatus.Pending),
            Approved = CountOf(JobStatus.Approved),
            Rejected = CountOf(JobStatus.Rejected),
            Closed = CountOf(JobStatus.Closed)
        };
    }

    public static Task<JobDto> GetDtoAsync(this IQueryable<Job> jobs, int jobId) =>
        jobs.Where(j => j.Id == jobId).Select(ToDto).SingleAsync();
}
