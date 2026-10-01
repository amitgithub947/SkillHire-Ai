using System.ComponentModel.DataAnnotations;
using SkillHireAI.API.DTOs.Jobs;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.DTOs.Admin;

public class AdminUserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminEmployerDto
{
    public int EmployerId { get; set; }
    public int UserId { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public int JobCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminCandidateDto
{
    public int CandidateId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? Skills { get; set; }
    public string? Experience { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UserStatsDto
{
    public int Total { get; set; }
    public int Admins { get; set; }
    public int Employers { get; set; }
    public int Candidates { get; set; }
}

public class AdminDashboardDto
{
    public UserStatsDto Users { get; set; } = new();
    public JobStatsDto Jobs { get; set; } = new();
    public List<JobDto> RecentPendingJobs { get; set; } = new();
}

public class RejectJobDto
{
    [Required(ErrorMessage = "Please give the employer a reason for the rejection.")]
    [StringLength(500, MinimumLength = 5, ErrorMessage = "Reason must be between 5 and 500 characters.")]
    public string Reason { get; set; } = string.Empty;
}
