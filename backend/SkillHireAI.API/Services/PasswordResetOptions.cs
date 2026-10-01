namespace SkillHireAI.API.Services;

/// <summary>The "PasswordReset" configuration section.</summary>
public class PasswordResetOptions
{
    public const string SectionName = "PasswordReset";

    /// <summary>How long an emailed code works.</summary>
    public int CodeLifetimeMinutes { get; set; } = 10;

    /// <summary>Wrong codes allowed before the code is locked and a new one must be requested.</summary>
    public int MaxAttempts { get; set; } = 5;

    /// <summary>Minimum time between two codes for the same account, to stop email spam.</summary>
    public int ResendCooldownSeconds { get; set; } = 60;

    /// <summary>Requests per minute per IP address, for each of the three endpoints.</summary>
    public int RequestsPerMinute { get; set; } = 10;
}
