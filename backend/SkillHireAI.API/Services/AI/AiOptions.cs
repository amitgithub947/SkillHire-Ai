namespace SkillHireAI.API.Services.AI;

/// <summary>
/// The "AI" configuration section. Uses OpenRouter's OpenAI-compatible Chat Completions API.
/// The API key is never stored in appsettings: it is read only from the OPENROUTER_API_KEY
/// environment variable (or user secret with the same name).
/// </summary>
public class AiOptions
{
    public const string SectionName = "AI";
    public const string ApiKeyVariable = "OPENROUTER_API_KEY";

    /// <summary>Filled from OPENROUTER_API_KEY at startup.</summary>
    public string? ApiKey { get; set; }

    public string Endpoint { get; set; } = "https://openrouter.ai/api/v1/chat/completions";

    /// <summary>OpenRouter model id. Must support structured outputs (JSON schema).</summary>
    public string Model { get; set; } = "nvidia/nemotron-3-super-120b-a12b:free";

    /// <summary>"low", "medium" or "high" for reasoning models; leave empty for models without reasoning.</summary>
    public string? ReasoningEffort { get; set; } = "low";

    /// <summary>Sent as the X-Title header so requests show up under this name on OpenRouter.</summary>
    public string AppName { get; set; } = "SkillHire AI";

    public int TimeoutSeconds { get; set; } = 90;

    /// <summary>Resume text longer than this is cut off before it is sent.</summary>
    public int MaxResumeCharacters { get; set; } = 12000;

    /// <summary>AI requests each user may make per minute.</summary>
    public int RequestsPerMinute { get; set; } = 10;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);
}
