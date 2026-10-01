using SkillHireAI.API.DTOs.Candidates;

namespace SkillHireAI.API.Services;

public interface ICandidateService
{
    Task<CandidateProfileDto> GetProfileAsync(int userId);
    Task<CandidateProfileDto> UpdateProfileAsync(int userId, UpdateCandidateProfileDto request);
    Task<CandidateProfileDto> UploadResumeAsync(int userId, IFormFile file);
    Task<CandidateProfileDto> DeleteResumeAsync(int userId);
    Task<ResumeFile> GetResumeAsync(int userId);
    Task<CandidateDashboardDto> GetDashboardAsync(int userId);
}
