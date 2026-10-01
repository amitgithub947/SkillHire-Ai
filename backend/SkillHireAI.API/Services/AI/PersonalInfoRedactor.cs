using System.Text.RegularExpressions;

namespace SkillHireAI.API.Services.AI;

/// <summary>
/// Removes contact details from text before it is sent to the AI provider.
/// The AI does not need them to read skills and experience.
/// </summary>
public static partial class PersonalInfoRedactor
{
    public static string Redact(string text, string? personName = null)
    {
        if (string.IsNullOrEmpty(text))
        {
            return text;
        }

        var result = EmailPattern().Replace(text, "[email]");
        result = UrlPattern().Replace(result, "[link]");
        result = PhonePattern().Replace(result, match =>
        {
            // Real phone numbers have 10-15 digits; this keeps date ranges like "2019 - 2023".
            var digits = match.Value.Count(char.IsDigit);
            return digits is >= 10 and <= 15 ? "[phone]" : match.Value;
        });

        if (!string.IsNullOrWhiteSpace(personName) && personName.Trim().Length >= 3)
        {
            result = Regex.Replace(result, $@"\b{Regex.Escape(personName.Trim())}\b", "[name]", RegexOptions.IgnoreCase);
        }

        return result;
    }

    /// <summary>Collapses runs of spaces and blank lines left over from PDF extraction.</summary>
    public static string CleanWhitespace(string text)
    {
        var lines = text
            .Split('\n')
            .Select(line => ExtraSpaces().Replace(line, " ").Trim())
            .Where(line => line.Length > 0);

        return string.Join('\n', lines);
    }

    [GeneratedRegex(@"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")]
    private static partial Regex EmailPattern();

    [GeneratedRegex(@"(https?://|www\.)\S+|\b(linkedin|github)\.com/\S+", RegexOptions.IgnoreCase)]
    private static partial Regex UrlPattern();

    [GeneratedRegex(@"(?<![\w+])\+?\d[\d ().-]{7,}\d(?!\w)")]
    private static partial Regex PhonePattern();

    [GeneratedRegex(@"[ \t\f\v\r]+")]
    private static partial Regex ExtraSpaces();
}
