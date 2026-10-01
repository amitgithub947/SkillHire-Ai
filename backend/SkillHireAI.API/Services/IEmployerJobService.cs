using SkillHireAI.API.DTOs.Jobs;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

/// <summary>Job operations an employer performs on their own jobs.</summary>
public interface IEmployerJobService
{
    Task<List<JobDto>> GetMyJobsAsync(int userId, JobStatus? status);
    Task<JobDto> GetMyJobAsync(int userId, int jobId);
    Task<JobDto> CreateAsync(int userId, CreateJobDto request);
    Task<JobDto> UpdateAsync(int userId, int jobId, UpdateJobDto request);
    Task<JobDto> CloseAsync(int userId, int jobId);
}
