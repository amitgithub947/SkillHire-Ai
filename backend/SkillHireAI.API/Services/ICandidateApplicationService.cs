using SkillHireAI.API.DTOs.Applications;
using SkillHireAI.API.DTOs.Interviews;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

public interface ICandidateApplicationService
{
    Task<CandidateApplicationDto> ApplyAsync(int userId, CreateApplicationDto request);
    Task<List<CandidateApplicationDto>> GetMyApplicationsAsync(int userId, ApplicationStatus? status);
    Task<CandidateApplicationDto> GetMyApplicationAsync(int userId, int applicationId);
    Task<CandidateApplicationDto> UpdateAsync(int userId, int applicationId, UpdateApplicationDto request);
    Task WithdrawAsync(int userId, int applicationId);
    Task<List<InterviewDto>> GetMyInterviewsAsync(int userId, bool upcomingOnly);

    // Used by the candidate dashboard, which already knows the candidate id.
    Task<List<CandidateApplicationDto>> GetRecentForCandidateAsync(int candidateId, int count);
    Task<List<InterviewDto>> GetUpcomingInterviewsForCandidateAsync(int candidateId, int count);
}
