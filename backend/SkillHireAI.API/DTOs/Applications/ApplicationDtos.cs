using System.ComponentModel.DataAnnotations;
using SkillHireAI.API.DTOs.Interviews;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.DTOs.Applications;

public class CreateApplicationDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Choose a job to apply for.")]
    public int JobId { get; set; }

    [StringLength(3000, ErrorMessage = "Cover letter must be 3000 characters or fewer.")]
    public string? CoverLetter { get; set; }
}

public class UpdateApplicationDto
{
    [StringLength(3000, ErrorMessage = "Cover letter must be 3000 characters or fewer.")]
    public string? CoverLetter { get; set; }
}

public class ApplicationStatsDto
{
    public int Total { get; set; }
    public int Applied { get; set; }
    public int Shortlisted { get; set; }
    public int InterviewScheduled { get; set; }
    public int Selected { get; set; }
    public int Rejected { get; set; }
}

/// <summary>An application as seen by the candidate who made it.</summary>
public class CandidateApplicationDto
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyLogoUrl { get; set; }
    public string? JobLocation { get; set; }
    public JobStatus JobStatus { get; set; }
    public string? CoverLetter { get; set; }
    public ApplicationStatus Status { get; set; }
    public DateTime AppliedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<InterviewDto> Interviews { get; set; } = [];
}

/// <summary>One row in the employer's applications list.</summary>
public class EmployerApplicationDto
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public int CandidateId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public string? CandidateLocation { get; set; }
    public int CandidateExperienceYears { get; set; }
    public List<string> CandidateSkills { get; set; } = [];
    public bool HasResume { get; set; }
    public ApplicationStatus Status { get; set; }
    public DateTime AppliedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    /// <summary>The next scheduled interview, if any.</summary>
    public DateTime? NextInterviewAt { get; set; }
}

public class EmployerApplicationDetailsDto : EmployerApplicationDto
{
    public string? CoverLetter { get; set; }
    public JobStatus JobStatus { get; set; }
    public string? JobSkills { get; set; }
    public string? CandidatePhone { get; set; }
    public string? CandidateExperience { get; set; }
    public string? ResumeUrl { get; set; }
    public string? ResumeFileName { get; set; }
    public List<InterviewDto> Interviews { get; set; } = [];
}
