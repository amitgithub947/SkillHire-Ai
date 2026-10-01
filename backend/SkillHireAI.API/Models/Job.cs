namespace SkillHireAI.API.Models;

public class Job
{
    public int Id { get; set; }
    public int EmployerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;

    /// <summary>Comma-separated key skills, e.g. "C#, ASP.NET Core, SQL". Used by the skills filter.</summary>
    public string? Skills { get; set; }

    public string? Location { get; set; }
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }

    /// <summary>Minimum years of experience.</summary>
    public int ExperienceRequired { get; set; }

    public JobStatus Status { get; set; } = JobStatus.Pending;
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public Employer Employer { get; set; } = null!;
    public ICollection<Application> Applications { get; set; } = new List<Application>();
}
