using SkillHireAI.API.DTOs.Common;
using SkillHireAI.API.DTOs.Jobs;

namespace SkillHireAI.API.Services;

public interface ICandidateJobService
{
    Task<PagedResult<JobListingDto>> SearchAsync(int userId, JobSearchQuery query);
    Task<JobListingDetailsDto> GetAsync(int userId, int jobId);

    /// <summary>Newest approved jobs the candidate has not applied to yet.</summary>
    Task<List<JobListingDto>> GetLatestNotAppliedAsync(int candidateId, int count);
}
