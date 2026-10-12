using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using SkillHireAI.API.Middleware;

namespace SkillHireAI.API.Services.AI;

/// <summary>
/// Calls OpenRouter's OpenAI-compatible Chat Completions API with structured outputs
/// (a JSON schema), checks the answer and reads it into a C# class.
/// </summary>
public class AiClient : IAiClient
{
    private const string JsonOnlyRule = "Reply with one JSON object that matches the response schema and nothing else.";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        NumberHandling = JsonNumberHandling.AllowReadingFromString
    };

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

        var body = new JsonObject
        {
            ["model"] = _options.Model,
            ["messages"] = new JsonArray(
                new JsonObject { ["role"] = "system", ["content"] = $"{systemPrompt}\n{JsonOnlyRule}" },
                new JsonObject { ["role"] = "user", ["content"] = userMessage }),
            ["response_format"] = new JsonObject
            {
                ["type"] = "json_schema",
                ["json_schema"] = new JsonObject { ["name"] = schemaName, ["strict"] = true, ["schema"] = schema.DeepClone() }
            },
            // Only use providers that really support everything we ask for (structured outputs above all).
            ["provider"] = new JsonObject { ["require_parameters"] = true }
        };

        if (!string.IsNullOrWhiteSpace(_options.ReasoningEffort))
        {
            body["reasoning"] = new JsonObject { ["effort"] = _options.ReasoningEffort, ["exclude"] = true };
        }

        var json = body.ToJsonString();

        // Overload errors are usually brief, so try a couple more times before giving up.
        // 429 is not retried: free models have a small per-minute and daily quota, and retrying burns more.
        for (var attempt = 1; ; attempt++)
        {
            var (status, responseText) = await SendAsync(json, schemaName, cancellationToken);

            // OpenRouter sometimes reports a provider error inside a 200 response.
            if (status == HttpStatusCode.OK && ErrorInBody(responseText) is { } bodyStatus)
            {
                status = bodyStatus;
            }

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
        status is HttpStatusCode.RequestTimeout or HttpStatusCode.InternalServerError
            or HttpStatusCode.BadGateway or HttpStatusCode.ServiceUnavailable or HttpStatusCode.GatewayTimeout;

    /// <summary>Returns the error status when a 200 response actually carries an error.</summary>
    private static HttpStatusCode? ErrorInBody(string responseText)
    {
        try
        {
            var root = JsonNode.Parse(responseText);
            var error = root?["error"] ?? root?["choices"]?[0]?["error"];
            if (error is null && root?["choices"]?[0]?["finish_reason"]?.GetValue<string>() != "error")
            {
                return null;
            }

            return error?["code"] is JsonValue code && code.TryGetValue(out int number) && number >= 400
                ? (HttpStatusCode)number
                : HttpStatusCode.BadGateway;
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException)
        {
            return null;
        }
    }

    private async Task<(HttpStatusCode Status, string Body)> SendAsync(string json, string schemaName, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, _options.Endpoint)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        request.Headers.TryAddWithoutValidation("X-Title", _options.AppName);

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

            var result = JsonSerializer.Deserialize<T>(ExtractJson(content), JsonOptions);
            if (result is null || !IsValid(result))
            {
                _logger.LogWarning("AI returned values outside the allowed range for {Schema}", schemaName);
                throw BadGateway();
            }

            return result;
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException or FormatException)
        {
            _logger.LogWarning(ex, "AI returned JSON that does not match {Schema}", schemaName);
            throw BadGateway();
        }
    }

    /// <summary>Some models wrap the JSON in ```json fences or add a sentence around it.</summary>
    private static string ExtractJson(string content)
    {
        var start = content.IndexOf('{');
        var end = content.LastIndexOf('}');
        return start >= 0 && end > start ? content[start..(end + 1)] : content;
    }

    /// <summary>Rejects answers that parsed but make no sense (missing lists, scores outside 0-100).</summary>
    private static bool IsValid(object result) => result switch
    {
        AiResumeAnalysis r => !string.IsNullOrWhiteSpace(r.Summary),
        AiSkillMatch m => m.MatchPercentage is >= 0 and <= 100 && m.MatchedSkills is not null && m.MissingSkills is not null,
        JobMatchList l => l.Matches is not null && l.Matches.All(j => j is not null && j.JobId > 0 && j.MatchPercentage is >= 0 and <= 100),
        _ => true
    };

    private AppException ToFriendlyError(HttpStatusCode status, string responseText, string schemaName)
    {
        // Provider error bodies never contain our key, but can be long; log a short piece.
        var detail = responseText.Length > 500 ? responseText[..500] : responseText;

        switch (status)
        {
            case HttpStatusCode.Unauthorized:
            case HttpStatusCode.Forbidden:
                _logger.LogError("OpenRouter rejected the API key ({Status}) for {Schema}: {Detail}", (int)status, schemaName, detail);
                return Unavailable("AI features are temporarily unavailable. Please try again later.");

            case HttpStatusCode.PaymentRequired:
                _logger.LogError("OpenRouter account has no credits left for {Schema}: {Detail}", schemaName, detail);
                return Unavailable("AI features are temporarily unavailable. Please try again later.");

            case HttpStatusCode.TooManyRequests:
                _logger.LogWarning("OpenRouter rate limit or free quota reached for {Schema}: {Detail}", schemaName, detail);
                return Unavailable("The AI service is busy right now. Please try again in a minute.");

            case HttpStatusCode.BadRequest:
            case HttpStatusCode.NotFound:
                // Usually a wrong model id, or no provider for this model under the account's privacy settings.
                _logger.LogError("OpenRouter rejected the {Schema} request for model {Model} ({Status}): {Detail}",
                    schemaName, _options.Model, (int)status, detail);
                return Unavailable("AI features are temporarily unavailable. Please try again later.");

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
