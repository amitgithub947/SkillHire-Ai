namespace SkillHireAI.API.Services;

public record SkillMatchResult(int Percentage, List<string> MatchedSkills, List<string> MissingSkills);

/// <summary>
/// Exact-name skill match: the share of the job's skills the candidate has.
/// Unlike the AI skill match, it doesn't recognise close equivalents ("JS" vs "JavaScript").
/// </summary>
public static class SkillMatchCalculator
{
    /// <param name="candidateSkills">Comma-separated, e.g. "C#, React".</param>
    /// <param name="jobSkills">Comma-separated, e.g. "C#, SQL, Azure".</param>
    public static SkillMatchResult Calculate(string? candidateSkills, string? jobSkills)
    {
        var required = SkillList.Parse(jobSkills);
        if (required.Count == 0)
        {
            return new SkillMatchResult(0, [], []);
        }

        var owned = SkillList.Parse(candidateSkills).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var matched = required.Where(owned.Contains).ToList();
        var missing = required.Where(skill => !owned.Contains(skill)).ToList();

        var percentage = (int)Math.Round(matched.Count * 100.0 / required.Count, MidpointRounding.AwayFromZero);
        return new SkillMatchResult(percentage, matched, missing);
    }
}
