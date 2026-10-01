using System.ComponentModel.DataAnnotations;
using SkillHireAI.API.DTOs.Applications;
using SkillHireAI.API.DTOs.Interviews;
using SkillHireAI.API.DTOs.Jobs;

namespace SkillHireAI.API.DTOs.Candidates;

public class CandidateProfileDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public List<string> Skills { get; set; } = [];
    public int ExperienceYears { get; set; }
    public string? Experience { get; set; }
    public string? ResumeUrl { get; set; }
    public string? ResumeFileName { get; set; }
    public DateTime? ResumeUploadedAt { get; set; }
    public bool HasResume { get; set; }

    /// <summary>True when phone, location, skills and a resume (file or link) are present.</summary>
    public bool IsComplete { get; set; }
}

public class UpdateCandidateProfileDto
{
    [Phone(ErrorMessage = "Enter a valid phone number.")]
    [StringLength(30)]
    public string? Phone { get; set; }

    [StringLength(200)]
    public string? Location { get; set; }

    /// <summary>Comma-separated list, e.g. "C#, React, SQL".</summary>
    [StringLength(1000, ErrorMessage = "Skills must be 1000 characters or fewer.")]
    public string? Skills { get; set; }

    [Range(0, 50, ErrorMessage = "Experience must be between 0 and 50 years.")]
    public int ExperienceYears { get; set; }

    [StringLength(3000, ErrorMessage = "Experience summary must be 3000 characters or fewer.")]
    public string? Experience { get; set; }

    [Url(ErrorMessage = "Resume link must be a full URL starting with http:// or https://.")]
    [StringLength(500)]
    public string? ResumeUrl { get; set; }
}

public class UploadResumeDto
{
    /// <summary>PDF, DOC or DOCX, up to 5 MB.</summary>
    [Required(ErrorMessage = "Choose a resume file to upload.")]
    public IFormFile File { get; set; } = null!;
}

public class CandidateDashboardDto
{
    public string Name { get; set; } = string.Empty;
    public bool ProfileComplete { get; set; }
    public bool HasResume { get; set; }
    public ApplicationStatsDto Applications { get; set; } = new();
    public List<InterviewDto> UpcomingInterviews { get; set; } = [];
    public List<CandidateApplicationDto> RecentApplications { get; set; } = [];
    public List<JobListingDto> LatestJobs { get; set; } = [];
}
