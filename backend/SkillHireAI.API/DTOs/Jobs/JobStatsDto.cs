namespace SkillHireAI.API.DTOs.Jobs;

public class JobStatsDto
{
    public int Total { get; set; }
    public int Pending { get; set; }
    public int Approved { get; set; }
    public int Rejected { get; set; }
    public int Closed { get; set; }
}
