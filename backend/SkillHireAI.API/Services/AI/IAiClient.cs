namespace SkillHireAI.API.Services.AI;

/// <summary>
/// The only place that talks to the AI provider (Gemini by default). Inputs contain skills
/// and job details, never names, emails or phone numbers.
/// </summary>
public interface IAiClient
{
    /// <summary>Turns resume text into structured data.</summary>
    Task<AiResumeAnalysis> AnalyzeResumeAsync(string resumeText, CancellationToken cancellationToken = default);

    /// <summary>Compares a candidate's skills with one job.</summary>
    Task<AiSkillMatch> MatchSkillsAsync(CandidateSkillProfile candidate, JobForMatching job, CancellationToken cancellationToken = default);

    /// <summary>Scores how relevant each job is for the candidate.</summary>
    Task<List<AiJobMatch>> MatchJobsAsync(CandidateSkillProfile candidate, IReadOnlyList<JobForMatching> jobs, CancellationToken cancellationToken = default);
}

// ---------- What we send ----------

public record CandidateSkillProfile(
    IReadOnlyList<string> Skills,
    decimal? ExperienceYears,
    string? ExperienceSummary);

public record JobForMatching(
    int Id,
    string Title,
    IReadOnlyList<string> Skills,
    int ExperienceRequired,
    string Requirements,
    string? Description);

// ---------- What the AI returns (matches the JSON schemas in AiPrompts) ----------

public class AiResumeAnalysis
{
    public string Summary { get; set; } = string.Empty;
    public decimal? TotalExperienceYears { get; set; }
    public List<string> Skills { get; set; } = [];
    public List<string> Technologies { get; set; } = [];
    public List<AiExperience> Experience { get; set; } = [];
    public List<AiEducation> Education { get; set; } = [];
    public List<AiProject> Projects { get; set; } = [];
}

public class AiExperience
{
    public string Role { get; set; } = string.Empty;
    public string? Organization { get; set; }
    public string? Duration { get; set; }
    public List<string> Highlights { get; set; } = [];
}

public class AiEducation
{
    public string Degree { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public string? Year { get; set; }
}

public class AiProject
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Technologies { get; set; } = [];
}

public class AiSkillMatch
{
    public int MatchPercentage { get; set; }
    public List<string> MatchedSkills { get; set; } = [];
    public List<string> MissingSkills { get; set; } = [];
    public string Summary { get; set; } = string.Empty;
}

public class AiJobMatch
{
    public int JobId { get; set; }
    public int MatchPercentage { get; set; }
    public List<string> MatchedSkills { get; set; } = [];
    public string Reason { get; set; } = string.Empty;
}
