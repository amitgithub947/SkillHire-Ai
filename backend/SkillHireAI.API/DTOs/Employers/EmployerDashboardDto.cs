using SkillHireAI.API.DTOs.Jobs;

namespace SkillHireAI.API.DTOs.Employers;

public class EmployerDashboardDto
{
    public string CompanyName { get; set; } = string.Empty;
    public bool ProfileComplete { get; set; }
    public JobStatsDto Jobs { get; set; } = new();
    public List<JobDto> RecentJobs { get; set; } = new();
}
