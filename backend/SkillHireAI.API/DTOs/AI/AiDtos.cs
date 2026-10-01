using System.ComponentModel.DataAnnotations;
using SkillHireAI.API.DTOs.Jobs;
using SkillHireAI.API.Services.AI;

namespace SkillHireAI.API.DTOs.AI;

public class AnalyzeResumeRequest
{
    /// <summary>
    /// Optional PDF (max 5 MB) to analyze. Leave empty to analyze the resume you already
    /// uploaded, which must then be a PDF. Analyzing a file does not replace your saved resume.
    /// </summary>
    public IFormFile? File { get; set; }
}

public class ResumeAnalysisDto
{
    public int Id { get; set; }
    public string? ResumeFileName { get; set; }
    public string Summary { get; set; } = string.Empty;
    public decimal? TotalExperienceYears { get; set; }
    public List<string> Skills { get; set; } = [];
    public List<string> Technologies { get; set; } = [];
    public List<AiExperience> Experience { get; set; } = [];
    public List<AiEducation> Education { get; set; } = [];
    public List<AiProject> Projects { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}

public class SkillMatchRequest
{
    [Required]
    public int? JobId { get; set; }
}

/// <summary>An assistance signal only. It never selects or rejects anyone.</summary>
public class SkillMatchDto
{
    public int JobId { get; set; }
    public int MatchPercentage { get; set; }
    public List<string> MatchedSkills { get; set; } = [];
    public List<string> MissingSkills { get; set; } = [];
    public string Summary { get; set; } = string.Empty;

    /// <summary>True when skills from your latest resume analysis were included.</summary>
    public bool UsedResumeAnalysis { get; set; }
}

public class JobMatchDto
{
    public JobListingDto Job { get; set; } = new();
    public int MatchPercentage { get; set; }
    public List<string> MatchedSkills { get; set; } = [];
    public string Reason { get; set; } = string.Empty;
}
