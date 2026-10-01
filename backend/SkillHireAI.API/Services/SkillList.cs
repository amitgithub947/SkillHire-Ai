namespace SkillHireAI.API.Services;

/// <summary>Helpers for comma-separated skill lists such as "C#, React, SQL".</summary>
public static class SkillList
{
    public static List<string> Parse(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? []
            : value
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

    /// <summary>Trims and de-duplicates the list. Returns null when there are no skills.</summary>
    public static string? Normalize(string? value)
    {
        var skills = Parse(value);
        return skills.Count == 0 ? null : string.Join(", ", skills);
    }
}
