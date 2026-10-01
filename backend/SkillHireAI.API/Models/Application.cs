namespace SkillHireAI.API.Models;

public class Application
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public int CandidateId { get; set; }
    public string? CoverLetter { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Applied;
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;

    public Job Job { get; set; } = null!;
    public Candidate Candidate { get; set; } = null!;
    public ICollection<Interview> Interviews { get; set; } = new List<Interview>();
}
