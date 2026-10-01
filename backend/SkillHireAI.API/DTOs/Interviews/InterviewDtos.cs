using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.DTOs.Interviews;

public class InterviewDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public DateTime InterviewDate { get; set; }
    public InterviewType Type { get; set; }
    public string? MeetingLink { get; set; }
    public string? Notes { get; set; }
    public InterviewStatus Status { get; set; }

    /// <summary>Candidates only see feedback once the interview is completed.</summary>
    public string? Feedback { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Only set in the response to scheduling or cancelling: whether the candidate was emailed.
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? CandidateNotified { get; set; }
}

public class ScheduleInterviewDto : IValidatableObject
{
    /// <summary>Date and time of the interview. Send with a UTC offset, e.g. 2026-10-05T10:30:00+05:30.</summary>
    [Required]
    public DateTimeOffset? InterviewDate { get; set; }

    [Required]
    public InterviewType? Type { get; set; }

    /// <summary>Required for online interviews.</summary>
    [Url(ErrorMessage = "Meeting link must be a full URL starting with http:// or https://.")]
    [StringLength(500)]
    public string? MeetingLink { get; set; }

    /// <summary>Address, phone number or other instructions for the candidate.</summary>
    [StringLength(1000, ErrorMessage = "Notes must be 1000 characters or fewer.")]
    public string? Notes { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (InterviewDate.HasValue && InterviewDate.Value <= DateTimeOffset.UtcNow)
        {
            yield return new ValidationResult("Interview date must be in the future.", [nameof(InterviewDate)]);
        }

        if (Type == InterviewType.Online && string.IsNullOrWhiteSpace(MeetingLink))
        {
            yield return new ValidationResult("A meeting link is required for online interviews.", [nameof(MeetingLink)]);
        }
    }
}

/// <summary>Mark an interview as completed or cancelled, with optional feedback.</summary>
public class UpdateInterviewStatusDto
{
    /// <summary>Completed or Cancelled.</summary>
    [Required]
    public InterviewStatus? Status { get; set; }

    [StringLength(2000, ErrorMessage = "Feedback must be 2000 characters or fewer.")]
    public string? Feedback { get; set; }
}
