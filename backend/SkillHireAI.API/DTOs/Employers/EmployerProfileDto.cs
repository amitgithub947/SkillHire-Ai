namespace SkillHireAI.API.DTOs.Employers;

public class EmployerProfileDto
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyDescription { get; set; }
    public string? Location { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public bool IsComplete { get; set; }
}
