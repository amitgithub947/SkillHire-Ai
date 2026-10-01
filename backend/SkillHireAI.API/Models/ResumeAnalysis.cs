namespace SkillHireAI.API.Models;

/// <summary>
/// One AI analysis of a candidate's PDF resume. Lists are stored as JSON text;
/// AIResult keeps the full structured response.
/// </summary>
public class ResumeAnalysis
{
    public int Id { get; set; }
    public int CandidateId { get; set; }

    /// <summary>Name of the PDF that was analyzed.</summary>
    public string? ResumeFileName { get; set; }

    public string? Summary { get; set; }
    public decimal? TotalExperienceYears { get; set; }

    /// <summary>JSON array of skills, e.g. ["REST API design", "Unit testing"].</summary>
    public string? ExtractedSkills { get; set; }

    /// <summary>JSON array of languages, frameworks and tools.</summary>
    public string? Technologies { get; set; }

    /// <summary>JSON array of work experience entries.</summary>
    public string? Experience { get; set; }

    /// <summary>JSON array of education entries.</summary>
    public string? Education { get; set; }

    /// <summary>JSON array of projects.</summary>
    public string? Projects { get; set; }

    /// <summary>The complete structured JSON returned by the AI.</summary>
    public string? AIResult { get; set; }

    /// <summary>The AI model that produced this analysis.</summary>
    public string? Model { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Candidate Candidate { get; set; } = null!;
}
