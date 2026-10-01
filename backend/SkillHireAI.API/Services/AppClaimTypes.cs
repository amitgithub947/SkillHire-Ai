namespace SkillHireAI.API.Services;

/// <summary>Claim names written into the JWT. The React app reads the same names.</summary>
public static class AppClaimTypes
{
    public const string UserId = "userId";
    public const string Email = "email";
    public const string Name = "name";
    public const string Role = "role";
}
