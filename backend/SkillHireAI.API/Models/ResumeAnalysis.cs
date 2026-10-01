namespace SkillHireAI.API.Models;

public class ResumeAnalysis
{
    public int Id { get; set; }
    public int CandidateId { get; set; }
    public string? ExtractedSkills { get; set; }
    public string? Experience { get; set; }
    public string? Education { get; set; }
    public string? AIResult { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Candidate Candidate { get; set; } = null!;
}
