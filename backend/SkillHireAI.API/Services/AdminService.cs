using Microsoft.EntityFrameworkCore;
using SkillHireAI.API.Data;
using SkillHireAI.API.DTOs.Admin;
using SkillHireAI.API.DTOs.Jobs;
using SkillHireAI.API.Middleware;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

public class AdminService : IAdminService
{
    private readonly ApplicationDbContext _db;

    public AdminService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<AdminDashboardDto> GetDashboardAsync()
    {
        var roleCounts = await _db.Users
            .GroupBy(u => u.Role)
            .Select(g => new { Role = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Role, x => x.Count);

        return new AdminDashboardDto
        {
            Users = new UserStatsDto
            {
                Total = roleCounts.Values.Sum(),
                Admins = roleCounts.GetValueOrDefault(UserRole.Admin),
                Employers = roleCounts.GetValueOrDefault(UserRole.Employer),
                Candidates = roleCounts.GetValueOrDefault(UserRole.Candidate)
            },
            Jobs = await JobQueries.GetStatsAsync(_db.Jobs),
            RecentPendingJobs = await _db.Jobs
                .Where(j => j.Status == JobStatus.Pending)
                .OrderBy(j => j.CreatedAt)
                .Take(5)
                .Select(JobQueries.ToDto)
                .ToListAsync()
        };
    }

    public async Task<List<AdminUserDto>> GetUsersAsync(UserRole? role, string? search)
    {
        var query = _db.Users.AsQueryable();

        if (role.HasValue)
        {
            query = query.Where(u => u.Role == role.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(u => u.Name.Contains(term) || u.Email.Contains(term));
        }

        return await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<AdminEmployerDto>> GetEmployersAsync(string? search)
    {
        var query = _db.Employers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(e =>
                e.CompanyName.Contains(term) || e.User.Name.Contains(term) || e.User.Email.Contains(term));
        }

        return await query
            .OrderByDescending(e => e.User.CreatedAt)
            .Select(e => new AdminEmployerDto
            {
                EmployerId = e.Id,
                UserId = e.UserId,
                ContactName = e.User.Name,
                Email = e.User.Email,
                CompanyName = e.CompanyName,
                Location = e.Location,
                Website = e.Website,
                LogoUrl = e.LogoUrl,
                JobCount = e.Jobs.Count,
                CreatedAt = e.User.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<AdminCandidateDto>> GetCandidatesAsync(string? search)
    {
        var query = _db.Candidates.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(c => c.User.Name.Contains(term) || c.User.Email.Contains(term));
        }

        return await query
            .OrderByDescending(c => c.User.CreatedAt)
            .Select(c => new AdminCandidateDto
            {
                CandidateId = c.Id,
                UserId = c.UserId,
                Name = c.User.Name,
                Email = c.User.Email,
                Phone = c.Phone,
                Location = c.Location,
                Skills = c.Skills,
                Experience = c.Experience,
                CreatedAt = c.User.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<JobDto>> GetJobsAsync(JobStatus? status, string? search)
    {
        var query = _db.Jobs.AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(j => j.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(j => j.Title.Contains(term) || j.Employer.CompanyName.Contains(term));
        }

        // Pending jobs are a review queue, so show the oldest first.
        query = status == JobStatus.Pending
            ? query.OrderBy(j => j.CreatedAt)
            : query.OrderByDescending(j => j.CreatedAt);

        return await query.Select(JobQueries.ToDto).ToListAsync();
    }

    public async Task<JobDto> GetJobAsync(int jobId)
    {
        return await _db.Jobs
            .Where(j => j.Id == jobId)
            .Select(JobQueries.ToDto)
            .SingleOrDefaultAsync()
            ?? throw AppException.NotFound("Job not found.");
    }

    public async Task<JobDto> ApproveJobAsync(int jobId)
    {
        var job = await GetPendingJobAsync(jobId, "approved");

        job.Status = JobStatus.Approved;
        job.RejectionReason = null;
        job.ReviewedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return await _db.Jobs.GetDtoAsync(job.Id);
    }

    public async Task<JobDto> RejectJobAsync(int jobId, string reason)
    {
        var job = await GetPendingJobAsync(jobId, "rejected");

        job.Status = JobStatus.Rejected;
        job.RejectionReason = reason.Trim();
        job.ReviewedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return await _db.Jobs.GetDtoAsync(job.Id);
    }

    private async Task<Job> GetPendingJobAsync(int jobId, string action)
    {
        var job = await _db.Jobs.SingleOrDefaultAsync(j => j.Id == jobId)
            ?? throw AppException.NotFound("Job not found.");

        if (job.Status != JobStatus.Pending)
        {
            throw AppException.Conflict($"Only pending jobs can be {action}. This job is {job.Status}.");
        }

        return job;
    }
}
