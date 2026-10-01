using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;
using SkillHireAI.API.Middleware;

namespace SkillHireAI.API.Services.AI;

/// <summary>
/// Calls an OpenAI-compatible Chat Completions API (Gemini by default) with structured
/// outputs (a JSON schema), so every answer can be read straight into a C# class.
/// </summary>
public class AiClient : IAiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;
    private readonly AiOptions _options;
    private readonly ILogger<AiClient> _logger;

    public AiClient(HttpClient http, IOptions<AiOptions> options, ILogger<AiClient> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    public Task<AiResumeAnalysis> AnalyzeResumeAsync(string resumeText, CancellationToken cancellationToken = default)
    {
        var userMessage = $"<data>\n{resumeText}\n</data>";

        return CompleteAsync<AiResumeAnalysis>(
            AiPrompts.ResumeAnalysisName,
            AiPrompts.ResumeAnalysisSchema,
            AiPrompts.ResumeAnalysisSystem,
            userMessage,
            cancellationToken);
    }

    public Task<AiSkillMatch> MatchSkillsAsync(CandidateSkillProfile candidate, JobForMatching job, CancellationToken cancellationToken = default)
    {
        var userMessage = $"""
            <data>
            CANDIDATE
            {DescribeCandidate(candidate)}

            JOB
            {DescribeJob(job, includeDescription: true)}
            </data>
            """;

        return CompleteAsync<AiSkillMatch>(
            AiPrompts.SkillMatchName,
            AiPrompts.SkillMatchSchema,
            AiPrompts.SkillMatchSystem,
            userMessage,
            cancellationToken);
    }

    public async Task<List<AiJobMatch>> MatchJobsAsync(
        CandidateSkillProfile candidate,
        IReadOnlyList<JobForMatching> jobs,
        CancellationToken cancellationToken = default)
    {
        var jobText = string.Join("\n\n", jobs.Select(j => DescribeJob(j, includeDescription: false)));
        var userMessage = $"""
            <data>
            CANDIDATE
            {DescribeCandidate(candidate)}

            JOBS
            {jobText}
            </data>
            """;

        var result = await CompleteAsync<JobMatchList>(
            AiPrompts.JobMatchName,
            AiPrompts.JobMatchSchema,
            AiPrompts.JobMatchSystem,
            userMessage,
            cancellationToken);

        return result.Matches;
    }

    private async Task<T> CompleteAsync<T>(
        string schemaName,
        JsonObject schema,
        string systemPrompt,
        string userMessage,
        CancellationToken cancellationToken)
    {
        if (!_options.IsConfigured)
        {
            throw NotConfigured();
        }

        var body = new
        {
            model = _options.Model,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            },
            response_format = new
            {
                type = "json_schema",
                json_schema = new { name = schemaName, strict = true, schema }
            }
        };

        var json = JsonSerializer.Serialize(body);

        // Overload errors are usually brief, so try a couple more times before giving up.
        // 429 is not retried: on Gemini it usually means the quota is used up, and retrying burns more.
        for (var attempt = 1; ; attempt++)
        {
            var (status, responseText) = await SendAsync(json, schemaName, cancellationToken);

            if (status == HttpStatusCode.OK)
            {
                return ReadStructuredContent<T>(responseText, schemaName);
            }

            if (attempt <= RetryDelays.Length && IsTemporary(status))
            {
                _logger.LogInformation("AI provider returned {Status} for {Schema}; retrying (attempt {Attempt})", (int)status, schemaName, attempt + 1);
                await Task.Delay(RetryDelays[attempt - 1], cancellationToken);
                continue;
            }

            throw ToFriendlyError(status, responseText, schemaName);
        }
    }

    private static readonly TimeSpan[] RetryDelays = [TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(3)];

    private static bool IsTemporary(HttpStatusCode status) =>
        status is HttpStatusCode.InternalServerError
            or HttpStatusCode.BadGateway or HttpStatusCode.ServiceUnavailable or HttpStatusCode.GatewayTimeout;

    private async Task<(HttpStatusCode Status, string Body)> SendAsync(string json, string schemaName, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

        try
        {
            using var response = await _http.SendAsync(request, cancellationToken);
            return (response.StatusCode, await response.Content.ReadAsStringAsync(cancellationToken));
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("AI request {Schema} timed out after {Seconds}s", schemaName, _options.TimeoutSeconds);
            throw Unavailable("The AI service took too long to respond. Please try again.");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Could not reach the AI provider for {Schema}", schemaName);
            throw Unavailable("The AI service could not be reached. Please try again in a moment.");
        }
    }

    private T ReadStructuredContent<T>(string responseText, string schemaName)
    {
        try
        {
            var choice = JsonNode.Parse(responseText)?["choices"]?[0];
            var message = choice?["message"];

            if (message?["refusal"]?.GetValue<string>() is { Length: > 0 } refusal)
            {
                _logger.LogWarning("AI refused {Schema}: {Refusal}", schemaName, refusal);
                throw new AppException("The AI could not process this content. Please check it and try again.", StatusCodes.Status422UnprocessableEntity);
            }

            if (choice?["finish_reason"]?.GetValue<string>() == "length")
            {
                _logger.LogWarning("AI response for {Schema} was cut off", schemaName);
                throw BadGateway();
            }

            var content = message?["content"]?.GetValue<string>();
            if (string.IsNullOrWhiteSpace(content))
            {
                throw BadGateway();
            }

            return JsonSerializer.Deserialize<T>(content, JsonOptions) ?? throw BadGateway();
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException or FormatException)
        {
            _logger.LogWarning(ex, "AI returned JSON that does not match {Schema}", schemaName);
            throw BadGateway();
        }
    }

    private AppException ToFriendlyError(HttpStatusCode status, string responseText, string schemaName)
    {
        // Provider error bodies never contain our key, but can be long; log a short piece.
        var detail = responseText.Length > 500 ? responseText[..500] : responseText;

        switch (status)
        {
            case HttpStatusCode.Unauthorized:
            case HttpStatusCode.Forbidden:
                _logger.LogError("AI provider rejected the API key ({Status}) for {Schema}: {Detail}", (int)status, schemaName, detail);
                return Unavailable("AI features are temporarily unavailable. Please try again later.");

            case HttpStatusCode.TooManyRequests:
                _logger.LogWarning("AI provider rate limit or quota reached for {Schema}: {Detail}", schemaName, detail);
                return Unavailable("The AI service is busy right now. Please try again in a minute.");

            case HttpStatusCode.BadRequest:
            case HttpStatusCode.NotFound:
                _logger.LogError("AI provider rejected the {Schema} request ({Status}): {Detail}", schemaName, (int)status, detail);
                return BadGateway();

            default:
                _logger.LogWarning("AI provider returned {Status} for {Schema}: {Detail}", (int)status, schemaName, detail);
                return Unavailable("The AI service is having trouble right now. Please try again in a moment.");
        }
    }

    private static string DescribeCandidate(CandidateSkillProfile candidate)
    {
        var lines = new List<string>
        {
            $"Skills: {(candidate.Skills.Count > 0 ? string.Join(", ", candidate.Skills) : "none listed")}",
            $"Years of experience: {candidate.ExperienceYears?.ToString("0.#") ?? "unknown"}"
        };

        if (!string.IsNullOrWhiteSpace(candidate.ExperienceSummary))
        {
            lines.Add($"Background: {candidate.ExperienceSummary}");
        }

        return string.Join('\n', lines);
    }

    private static string DescribeJob(JobForMatching job, bool includeDescription)
    {
        var lines = new List<string>
        {
            $"Job id: {job.Id}",
            $"Title: {job.Title}",
            $"Skills: {(job.Skills.Count > 0 ? string.Join(", ", job.Skills) : "not listed")}",
            $"Experience required: {job.ExperienceRequired} years",
            $"Requirements: {job.Requirements}"
        };

        if (includeDescription && !string.IsNullOrWhiteSpace(job.Description))
        {
            lines.Add($"Description: {job.Description}");
        }

        return string.Join('\n', lines);
    }

    public static AppException NotConfigured() =>
        new("AI features are not set up on the server yet. Please try again later.", StatusCodes.Status503ServiceUnavailable);

    private static AppException Unavailable(string message) =>
        new(message, StatusCodes.Status503ServiceUnavailable);

    private static AppException BadGateway() =>
        new("The AI service returned an unexpected answer. Please try again.", StatusCodes.Status502BadGateway);

    private class JobMatchList
    {
        public List<AiJobMatch> Matches { get; set; } = [];
    }
}
