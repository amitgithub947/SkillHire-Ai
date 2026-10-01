namespace SkillHireAI.API.Services.Email;

/// <summary>
/// The "Email" configuration section. When SmtpHost is empty no real email is sent:
/// in Development the message is written to the API console instead.
/// Put the SMTP password in user secrets or an environment variable, never in appsettings.json.
/// </summary>
public class EmailOptions
{
    public const string SectionName = "Email";

    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string FromAddress { get; set; } = "no-reply@skillhire.ai";
    public string FromName { get; set; } = "SkillHire AI";

    /// <summary>Address of the React app, used for links in emails.</summary>
    public string AppBaseUrl { get; set; } = "http://localhost:5173";

    /// <summary>IANA time zone used to show interview times in emails, e.g. "Asia/Kolkata".</summary>
    public string DisplayTimeZone { get; set; } = "Asia/Kolkata";

    public bool IsSmtpConfigured => !string.IsNullOrWhiteSpace(SmtpHost);
}
