using System.ComponentModel.DataAnnotations;

namespace SkillHireAI.API.DTOs.Employers;

public class UpdateEmployerProfileDto
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string CompanyName { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? CompanyDescription { get; set; }

    [StringLength(200)]
    public string? Location { get; set; }

    [Url(ErrorMessage = "Website must be a full URL starting with http:// or https://.")]
    [StringLength(300)]
    public string? Website { get; set; }

    [Url(ErrorMessage = "Logo URL must be a full URL starting with http:// or https://.")]
    [StringLength(500)]
    public string? LogoUrl { get; set; }
}
