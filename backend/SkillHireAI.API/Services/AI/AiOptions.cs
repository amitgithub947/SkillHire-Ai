namespace SkillHireAI.API.Services.AI;

/// <summary>
/// The "AI" configuration section. Defaults to Google Gemini through its OpenAI-compatible API;
/// any OpenAI-compatible provider works by changing BaseUrl and Model.
/// The API key is never stored in appsettings: set it with user secrets
/// (dotnet user-secrets set "AI:ApiKey" "...") or the AI__ApiKey / GEMINI_API_KEY environment variable.
/// </summary>
public class AiOptions
{
    public const string SectionName = "AI";

    public string? ApiKey { get; set; }

    /// <summary>Must support structured outputs (JSON schema).</summary>
    public string Model { get; set; } = "gemini-3.8-flash";

    public string BaseUrl { get; set; } = "https://generativelanguage.googleapis.com/v1beta/openai/";

    public int TimeoutSeconds { get; set; } = 60;

    /// <summary>Resume text longer than this is cut off before it is sent.</summary>
    public int MaxResumeCharacters { get; set; } = 12000;

    /// <summary>AI requests each user may make per minute.</summary>
    public int RequestsPerMinute { get; set; } = 10;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);
}
