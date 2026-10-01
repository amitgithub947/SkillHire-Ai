using Microsoft.EntityFrameworkCore;
using SkillHireAI.API.Data;
using SkillHireAI.API.DTOs.Common;
using SkillHireAI.API.DTOs.Jobs;
using SkillHireAI.API.Middleware;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

/// <summary>Approved jobs as candidates see them. Pending, rejected and closed jobs are never listed.</summary>
public class CandidateJobService : ICandidateJobService
{
    private const int MaxPageSize = 50;

    private readonly ApplicationDbContext _db;

    public CandidateJobService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<JobListingDto>> SearchAsync(int userId, JobSearchQuery query)
    {
        var candidateId = await _db.GetCandidateIdAsync(userId);
        var jobs = ApprovedJobs();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            jobs = jobs.Where(j =>
                j.Title.Contains(term) ||
                j.Employer.CompanyName.Contains(term) ||
                j.Description.Contains(term) ||
                j.Requirements.Contains(term) ||
                (j.Skills != null && j.Skills.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(query.Location))
        {
            var location = query.Location.Trim();
            jobs = jobs.Where(j => j.Location != null && j.Location.Contains(location));
        }

        if (query.Experience.HasValue)
        {
            var years = Math.Max(0, query.Experience.Value);
            jobs = jobs.Where(j => j.ExperienceRequired <= years);
        }

        // Every listed skill must appear in the job's skills, title or requirements.
        foreach (var skill in SkillList.Parse(query.Skills))
        {
            jobs = jobs.Where(j =>
                (j.Skills != null && j.Skills.Contains(skill)) ||
                j.Title.Contains(skill) ||
                j.Requirements.Contains(skill));
        }

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);
        var total = await jobs.CountAsync();

        var rows = await Project(jobs.OrderByDescending(j => j.ReviewedAt ?? j.CreatedAt), candidateId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<JobListingDto>
        {
            Items = rows.Select(ToListing).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<JobListingDetailsDto> GetAsync(int userId, int jobId)
    {
        var candidateId = await _db.GetCandidateIdAsync(userId);

        var job = ApprovedJobs().Where(j => j.Id == jobId);

        var row = await Project(job, candidateId).SingleOrDefaultAsync()
            ?? throw AppException.NotFound("Job not found or no longer open.");

        var details = await job
            .Select(j => new JobListingDetailsDto
            {
                Description = j.Description,
                Requirements = j.Requirements,
                CompanyDescription = j.Employer.CompanyDescription,
                CompanyWebsite = j.Employer.Website,
                CompanyLocation = j.Employer.Location
            })
            .SingleAsync();

        Copy(row, details);
        return details;
    }

    public async Task<List<JobListingDto>> GetLatestNotAppliedAsync(int candidateId, int count)
    {
        var rows = await Project(
                ApprovedJobs()
                    .Where(j => !j.Applications.Any(a => a.CandidateId == candidateId))
                    .OrderByDescending(j => j.ReviewedAt ?? j.CreatedAt),
                candidateId)
            .Take(count)
            .ToListAsync();

        return rows.Select(ToListing).ToList();
    }

    public async Task<List<JobListingDto>> GetListingsAsync(int candidateId, IReadOnlyCollection<int> jobIds)
    {
        var rows = await Project(ApprovedJobs().Where(j => jobIds.Contains(j.Id)), candidateId).ToListAsync();
        return rows.Select(ToListing).ToList();
    }

    private IQueryable<Job> ApprovedJobs() => _db.Jobs.Where(j => j.Status == JobStatus.Approved);

    private static IQueryable<ListingRow> Project(IQueryable<Job> jobs, int candidateId) =>
        jobs.Select(j => new ListingRow
        {
            Id = j.Id,
            Title = j.Title,
            CompanyName = j.Employer.CompanyName,
            CompanyLogoUrl = j.Employer.LogoUrl,
            Location = j.Location,
            Skills = j.Skills,
            SalaryMin = j.SalaryMin,
            SalaryMax = j.SalaryMax,
            ExperienceRequired = j.ExperienceRequired,
            PostedAt = j.ReviewedAt ?? j.CreatedAt,
            ApplicationId = j.Applications.Where(a => a.CandidateId == candidateId).Select(a => (int?)a.Id).FirstOrDefault(),
            ApplicationStatus = j.Applications.Where(a => a.CandidateId == candidateId).Select(a => (ApplicationStatus?)a.Status).FirstOrDefault()
        });

    private static JobListingDto ToListing(ListingRow row)
    {
        var dto = new JobListingDto();
        Copy(row, dto);
        return dto;
    }

    private static void Copy(ListingRow row, JobListingDto dto)
    {
        dto.Id = row.Id;
        dto.Title = row.Title;
        dto.CompanyName = row.CompanyName;
        dto.CompanyLogoUrl = row.CompanyLogoUrl;
        dto.Location = row.Location;
        dto.Skills = SkillList.Parse(row.Skills);
        dto.SalaryMin = row.SalaryMin;
        dto.SalaryMax = row.SalaryMax;
        dto.ExperienceRequired = row.ExperienceRequired;
        dto.PostedAt = row.PostedAt;
        dto.ApplicationId = row.ApplicationId;
        dto.ApplicationStatus = row.ApplicationStatus;
    }

    // SQL-friendly shape: skills stay a plain string until the row is in memory.
    private class ListingRow
    {
        public int Id { get; init; }
        public string Title { get; init; } = string.Empty;
        public string CompanyName { get; init; } = string.Empty;
        public string? CompanyLogoUrl { get; init; }
        public string? Location { get; init; }
        public string? Skills { get; init; }
        public decimal? SalaryMin { get; init; }
        public decimal? SalaryMax { get; init; }
        public int ExperienceRequired { get; init; }
        public DateTime PostedAt { get; init; }
        public int? ApplicationId { get; init; }
        public ApplicationStatus? ApplicationStatus { get; init; }
    }
}
