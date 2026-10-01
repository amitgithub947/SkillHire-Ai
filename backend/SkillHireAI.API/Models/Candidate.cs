namespace SkillHireAI.API.Models;

public class Candidate
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }

    /// <summary>Comma-separated list, e.g. "C#, React, SQL".</summary>
    public string? Skills { get; set; }

    /// <summary>Total years of work experience (used to match job requirements).</summary>
    public int ExperienceYears { get; set; }

    /// <summary>Free-text summary of past roles and projects.</summary>
    public string? Experience { get; set; }

    /// <summary>Optional external resume link (e.g. Google Drive or LinkedIn).</summary>
    public string? ResumeUrl { get; set; }

    /// <summary>Original name of the uploaded resume file, shown to users.</summary>
    public string? ResumeFileName { get; set; }

    /// <summary>Name of the uploaded file on disk. Never sent to clients.</summary>
    public string? ResumeStoredName { get; set; }

    public DateTime? ResumeUploadedAt { get; set; }

    public User User { get; set; } = null!;
    public ICollection<Application> Applications { get; set; } = new List<Application>();
    public ICollection<ResumeAnalysis> ResumeAnalyses { get; set; } = new List<ResumeAnalysis>();
}
