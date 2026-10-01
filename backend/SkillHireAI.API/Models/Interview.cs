namespace SkillHireAI.API.Models;

public class Interview
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }

    /// <summary>Stored in UTC.</summary>
    public DateTime InterviewDate { get; set; }

    public InterviewType Type { get; set; } = InterviewType.Online;
    public string? MeetingLink { get; set; }

    /// <summary>Extra details for the candidate, e.g. office address or who will call.</summary>
    public string? Notes { get; set; }

    public InterviewStatus Status { get; set; } = InterviewStatus.Scheduled;
    public string? Feedback { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Application Application { get; set; } = null!;
}
