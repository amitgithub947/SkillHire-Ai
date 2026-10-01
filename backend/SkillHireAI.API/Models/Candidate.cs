namespace SkillHireAI.API.Models;

public class Candidate
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? Skills { get; set; }
    public string? Experience { get; set; }
    public string? ResumeUrl { get; set; }

    public User User { get; set; } = null!;
    public ICollection<Application> Applications { get; set; } = new List<Application>();
    public ICollection<ResumeAnalysis> ResumeAnalyses { get; set; } = new List<ResumeAnalysis>();
}
