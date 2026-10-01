using SkillHireAI.API.DTOs.Admin;
using SkillHireAI.API.DTOs.Jobs;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

public interface IAdminService
{
    Task<AdminDashboardDto> GetDashboardAsync();
    Task<List<AdminUserDto>> GetUsersAsync(UserRole? role, string? search);
    Task<List<AdminEmployerDto>> GetEmployersAsync(string? search);
    Task<List<AdminCandidateDto>> GetCandidatesAsync(string? search);
    Task<List<JobDto>> GetJobsAsync(JobStatus? status, string? search);
    Task<JobDto> GetJobAsync(int jobId);
    Task<JobDto> ApproveJobAsync(int jobId);
    Task<JobDto> RejectJobAsync(int jobId, string reason);
}
