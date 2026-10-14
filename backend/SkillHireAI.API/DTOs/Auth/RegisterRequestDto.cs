using System.ComponentModel.DataAnnotations;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.DTOs.Auth;

public class RegisterRequestDto : IValidatableObject
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters long.")]
    [RegularExpression(@"^(?=.*[A-Za-z])(?=.*\d).+$", ErrorMessage = "Password must contain at least one letter and one number.")]
    public string Password { get; set; } = string.Empty;

    [Required]
    [Compare(nameof(Password), ErrorMessage = "Passwords do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;

    /// <summary>The old name of the Recruiter role, still accepted so older clients keep working.</summary>
    public const string LegacyRecruiterRole = "Employer";

    /// <summary>Only "Recruiter" or "Candidate". Admin accounts cannot self-register.</summary>
    [Required]
    [RegularExpression("^(Recruiter|Candidate|Employer)$", ErrorMessage = "Role must be Recruiter or Candidate.")]
    public string Role { get; set; } = string.Empty;

    /// <summary>Required when Role is Recruiter.</summary>
    [StringLength(200)]
    public string? CompanyName { get; set; }

    public bool IsRecruiter() => Role is nameof(UserRole.Recruiter) or LegacyRecruiterRole;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (IsRecruiter() && string.IsNullOrWhiteSpace(CompanyName))
        {
            yield return new ValidationResult(
                "Company name is required for recruiters.",
                new[] { nameof(CompanyName) });
        }
    }
}
