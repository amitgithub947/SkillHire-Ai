using SkillHireAI.API.DTOs.AI;

namespace SkillHireAI.API.Services.AI;

/// <summary>The three AI features for the logged-in candidate.</summary>
public interface IAiService
{
    Task<ResumeAnalysisDto> AnalyzeResumeAsync(int userId, IFormFile? file, CancellationToken cancellationToken);
    Task<ResumeAnalysisDto> GetLatestAnalysisAsync(int userId);
    Task<SkillMatchDto> MatchSkillsAsync(int userId, int jobId, CancellationToken cancellationToken);
    Task<List<JobMatchDto>> GetJobMatchesAsync(int userId, int count, CancellationToken cancellationToken);
}
