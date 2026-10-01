using Microsoft.EntityFrameworkCore;
using SkillHireAI.API.Data;
using SkillHireAI.API.DTOs.Jobs;
using SkillHireAI.API.Middleware;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

public class EmployerJobService : IEmployerJobService
{
    private readonly ApplicationDbContext _db;

    public EmployerJobService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<JobDto>> GetMyJobsAsync(int userId, JobStatus? status)
    {
        var employerId = await GetEmployerIdAsync(userId);
        var query = _db.Jobs.Where(j => j.EmployerId == employerId);

        if (status.HasValue)
        {
            query = query.Where(j => j.Status == status.Value);
        }

        return await query
            .OrderByDescending(j => j.CreatedAt)
            .Select(JobQueries.ToDto)
            .ToListAsync();
    }

    public async Task<JobDto> GetMyJobAsync(int userId, int jobId)
    {
        var employerId = await GetEmployerIdAsync(userId);

        return await _db.Jobs
            .Where(j => j.Id == jobId && j.EmployerId == employerId)
            .Select(JobQueries.ToDto)
            .SingleOrDefaultAsync()
            ?? throw JobNotFound();
    }

    public async Task<JobDto> CreateAsync(int userId, CreateJobDto request)
    {
        var employerId = await GetEmployerIdAsync(userId);

        var job = new Job
        {
            EmployerId = employerId,
            Status = JobStatus.Pending
        };
        Apply(job, request);

        _db.Jobs.Add(job);
        await _db.SaveChangesAsync();

        return await _db.Jobs.GetDtoAsync(job.Id);
    }

    public async Task<JobDto> UpdateAsync(int userId, int jobId, UpdateJobDto request)
    {
        var job = await GetOwnJobAsync(userId, jobId);

        if (job.Status == JobStatus.Closed)
        {
            throw AppException.Conflict("Closed jobs cannot be edited.");
        }

        Apply(job, request);
        job.UpdatedAt = DateTime.UtcNow;

        // Any edit to a reviewed job sends it back for admin review, so an
        // employer can never change a live job without approval.
        if (job.Status is JobStatus.Approved or JobStatus.Rejected)
        {
            job.Status = JobStatus.Pending;
            job.RejectionReason = null;
            job.ReviewedAt = null;
        }

        await _db.SaveChangesAsync();
        return await _db.Jobs.GetDtoAsync(job.Id);
    }

    public async Task<JobDto> CloseAsync(int userId, int jobId)
    {
        var job = await GetOwnJobAsync(userId, jobId);

        if (job.Status == JobStatus.Closed)
        {
            throw AppException.Conflict("This job is already closed.");
        }

        job.Status = JobStatus.Closed;
        job.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return await _db.Jobs.GetDtoAsync(job.Id);
    }

    private async Task<int> GetEmployerIdAsync(int userId)
    {
        var employerId = await _db.Employers
            .Where(e => e.UserId == userId)
            .Select(e => (int?)e.Id)
            .SingleOrDefaultAsync();

        return employerId ?? throw AppException.NotFound("Employer profile not found.");
    }

    // Jobs owned by another employer return 404 rather than 403 so their
    // existence isn't revealed.
    private async Task<Job> GetOwnJobAsync(int userId, int jobId)
    {
        var employerId = await GetEmployerIdAsync(userId);
        return await _db.Jobs.SingleOrDefaultAsync(j => j.Id == jobId && j.EmployerId == employerId)
            ?? throw JobNotFound();
    }

    private static AppException JobNotFound() => AppException.NotFound("Job not found.");

    private static void Apply(Job job, CreateJobDto request)
    {
        job.Title = request.Title.Trim();
        job.Description = request.Description.Trim();
        job.Requirements = request.Requirements.Trim();
        job.Location = string.IsNullOrWhiteSpace(request.Location) ? null : request.Location.Trim();
        job.SalaryMin = request.SalaryMin;
        job.SalaryMax = request.SalaryMax;
        job.ExperienceRequired = request.ExperienceRequired;
    }
}
