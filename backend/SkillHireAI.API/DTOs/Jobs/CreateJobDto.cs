using System.ComponentModel.DataAnnotations;
using SkillHireAI.API.DTOs.Validation;

namespace SkillHireAI.API.DTOs.Jobs;

/// <summary>
/// Fields an employer can set. Status is deliberately absent: new jobs always
/// start as Pending and only an admin can approve or reject them.
/// </summary>
public class CreateJobDto
{
    [Required]
    [StringLength(200, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(5000, MinimumLength = 20, ErrorMessage = "Description must be between 20 and 5000 characters.")]
    public string Description { get; set; } = string.Empty;

    [Required]
    [StringLength(3000, MinimumLength = 10, ErrorMessage = "Requirements must be between 10 and 3000 characters.")]
    public string Requirements { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Location { get; set; }

    [Range(0, 1_000_000_000, ErrorMessage = "Minimum salary must be 0 or more.")]
    public decimal? SalaryMin { get; set; }

    [Range(0, 1_000_000_000, ErrorMessage = "Maximum salary must be 0 or more.")]
    [NotLessThan(nameof(SalaryMin), ErrorMessage = "Maximum salary cannot be less than minimum salary.")]
    public decimal? SalaryMax { get; set; }

    /// <summary>Minimum years of experience (0–50).</summary>
    [Range(0, 50, ErrorMessage = "Experience must be between 0 and 50 years.")]
    public int ExperienceRequired { get; set; }
}

public class UpdateJobDto : CreateJobDto
{
}
