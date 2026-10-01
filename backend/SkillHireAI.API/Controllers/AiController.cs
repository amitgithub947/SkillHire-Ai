using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SkillHireAI.API.DTOs.AI;
using SkillHireAI.API.Models;
using SkillHireAI.API.Services;
using SkillHireAI.API.Services.AI;

namespace SkillHireAI.API.Controllers;

/// <summary>
/// AI features for candidates: resume analysis, skill matching and job recommendations.
/// Results are guidance only; they never select or reject anyone.
/// </summary>
[ApiController]
[Route("api/ai")]
[Authorize(Roles = nameof(UserRole.Candidate))]
[Produces("application/json")]
public class AiController : ControllerBase
{
    public const string RateLimitPolicy = "ai";

    // Slightly above the 5 MB file limit to leave room for the multipart envelope.
    private const long UploadRequestLimit = 6 * 1024 * 1024;

    private readonly IAiService _aiService;

    public AiController(IAiService aiService)
    {
        _aiService = aiService;
    }

    /// <summary>
    /// Analyze a PDF resume with AI and save the result. Attach a PDF (max 5 MB), or send
    /// no file to analyze the resume you already uploaded.
    /// </summary>
    [HttpPost("analyze-resume")]
    [EnableRateLimiting(RateLimitPolicy)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(UploadRequestLimit)]
    [RequestFormLimits(MultipartBodyLengthLimit = UploadRequestLimit)]
    [ProducesResponseType(typeof(ResumeAnalysisDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ResumeAnalysisDto>> AnalyzeResume([FromForm] AnalyzeResumeRequest request, CancellationToken cancellationToken)
    {
        return Ok(await _aiService.AnalyzeResumeAsync(User.GetUserId(), request.File, cancellationToken));
    }

    /// <summary>My most recent resume analysis.</summary>
    [HttpGet("resume-analysis")]
    [ProducesResponseType(typeof(ResumeAnalysisDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ResumeAnalysisDto>> GetLatestAnalysis()
    {
        return Ok(await _aiService.GetLatestAnalysisAsync(User.GetUserId()));
    }

    /// <summary>
    /// Compare my profile and resume skills with an approved job. Returns a match percentage
    /// with matched and missing skills.
    /// </summary>
    [HttpPost("skill-match")]
    [EnableRateLimiting(RateLimitPolicy)]
    [ProducesResponseType(typeof(SkillMatchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<SkillMatchDto>> SkillMatch(SkillMatchRequest request, CancellationToken cancellationToken)
    {
        return Ok(await _aiService.MatchSkillsAsync(User.GetUserId(), request.JobId!.Value, cancellationToken));
    }

    /// <summary>Approved jobs I haven't applied to, ranked by AI relevance (best first).</summary>
    [HttpGet("job-matches")]
    [EnableRateLimiting(RateLimitPolicy)]
    [ProducesResponseType(typeof(List<JobMatchDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<List<JobMatchDto>>> GetJobMatches([FromQuery] int count = 5, CancellationToken cancellationToken = default)
    {
        return Ok(await _aiService.GetJobMatchesAsync(User.GetUserId(), count, cancellationToken));
    }
}
