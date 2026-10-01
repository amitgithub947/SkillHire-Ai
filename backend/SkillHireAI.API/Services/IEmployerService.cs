using SkillHireAI.API.DTOs.Employers;

namespace SkillHireAI.API.Services;

public interface IEmployerService
{
    Task<EmployerProfileDto> GetProfileAsync(int userId);
    Task<EmployerProfileDto> UpdateProfileAsync(int userId, UpdateEmployerProfileDto request);
    Task<EmployerDashboardDto> GetDashboardAsync(int userId);
}
