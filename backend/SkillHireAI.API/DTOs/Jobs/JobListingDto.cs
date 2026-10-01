using SkillHireAI.API.Models;

namespace SkillHireAI.API.DTOs.Jobs;

/// <summary>An approved job as seen by candidates. Admin-only fields are left out.</summary>
public class JobListingDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyLogoUrl { get; set; }
    public string? Location { get; set; }
    public List<string> Skills { get; set; } = [];
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public int ExperienceRequired { get; set; }
    public DateTime PostedAt { get; set; }

    /// <summary>Set when the logged-in candidate has already applied.</summary>
    public int? ApplicationId { get; set; }
    public ApplicationStatus? ApplicationStatus { get; set; }
}

public class JobListingDetailsDto : JobListingDto
{
    public string Description { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public string? CompanyDescription { get; set; }
    public string? CompanyWebsite { get; set; }
    public string? CompanyLocation { get; set; }
}

/// <summary>Query-string filters for browsing jobs.</summary>
public class JobSearchQuery
{
    /// <summary>Matches title, company, description or requirements.</summary>
    public string? Search { get; set; }

    public string? Location { get; set; }

    /// <summary>Your years of experience: only jobs requiring this many years or fewer are shown.</summary>
    public int? Experience { get; set; }

    /// <summary>Comma-separated. A job must match every skill listed.</summary>
    public string? Skills { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
