namespace SkillHireAI.API.Models;

public class Interview
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public DateTime InterviewDate { get; set; }
    public InterviewType Type { get; set; } = InterviewType.Online;
    public string? MeetingLink { get; set; }
    public InterviewStatus Status { get; set; } = InterviewStatus.Scheduled;
    public string? Feedback { get; set; }

    public Application Application { get; set; } = null!;
}
