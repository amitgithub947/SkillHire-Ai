using SkillHireAI.API.DTOs.Applications;
using SkillHireAI.API.DTOs.Interviews;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

public interface IEmployerApplicationService
{
    Task<List<EmployerApplicationDto>> GetApplicationsAsync(int userId, int? jobId, ApplicationStatus? status, string? search);
    Task<EmployerApplicationDetailsDto> GetApplicationAsync(int userId, int applicationId);
    Task<ResumeFile> GetResumeAsync(int userId, int applicationId);
    Task<EmployerApplicationDetailsDto> ShortlistAsync(int userId, int applicationId);
    Task<EmployerApplicationDetailsDto> RejectAsync(int userId, int applicationId);
    Task<EmployerApplicationDetailsDto> SelectAsync(int userId, int applicationId);
    Task<InterviewDto> ScheduleInterviewAsync(int userId, int applicationId, ScheduleInterviewDto request);
    Task<InterviewDto> UpdateInterviewStatusAsync(int userId, int interviewId, UpdateInterviewStatusDto request);
    Task<List<InterviewDto>> GetInterviewsAsync(int userId, bool upcomingOnly);
}
