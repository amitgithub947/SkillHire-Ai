using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillHireAI.API.DTOs.Candidates;
using SkillHireAI.API.DTOs.Interviews;
using SkillHireAI.API.Models;
using SkillHireAI.API.Services;

namespace SkillHireAI.API.Controllers;

/// <summary>The logged-in candidate's dashboard, profile, resume and interviews.</summary>
[ApiController]
[Route("api/candidate")]
[Authorize(Roles = nameof(UserRole.Candidate))]
[Produces("application/json")]
public class CandidateController : ControllerBase
{
    // Slightly above the 5 MB file limit to leave room for the multipart envelope.
    private const long UploadRequestLimit = 6 * 1024 * 1024;

    private readonly ICandidateService _candidateService;
    private readonly ICandidateApplicationService _applicationService;

    public CandidateController(ICandidateService candidateService, ICandidateApplicationService applicationService)
    {
        _candidateService = candidateService;
        _applicationService = applicationService;
    }

    /// <summary>Application counts, upcoming interviews, recent applications and new jobs.</summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(CandidateDashboardDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CandidateDashboardDto>> GetDashboard()
    {
        return Ok(await _candidateService.GetDashboardAsync(User.GetUserId()));
    }

    /// <summary>Get my profile.</summary>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(CandidateProfileDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CandidateProfileDto>> GetProfile()
    {
        return Ok(await _candidateService.GetProfileAsync(User.GetUserId()));
    }

    /// <summary>Update my profile. Skills are a comma-separated list.</summary>
    [HttpPut("profile")]
    [ProducesResponseType(typeof(CandidateProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CandidateProfileDto>> UpdateProfile(UpdateCandidateProfileDto request)
    {
        return Ok(await _candidateService.UpdateProfileAsync(User.GetUserId(), request));
    }

    /// <summary>Upload my resume (PDF, DOC or DOCX, max 5 MB). Replaces any previous file.</summary>
    [HttpPost("resume")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(UploadRequestLimit)]
    [RequestFormLimits(MultipartBodyLengthLimit = UploadRequestLimit)]
    [ProducesResponseType(typeof(CandidateProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CandidateProfileDto>> UploadResume([FromForm] UploadResumeDto request)
    {
        return Ok(await _candidateService.UploadResumeAsync(User.GetUserId(), request.File));
    }

    /// <summary>Download my uploaded resume.</summary>
    [HttpGet("resume")]
    [Produces("application/octet-stream", "application/problem+json")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadResume()
    {
        var resume = await _candidateService.GetResumeAsync(User.GetUserId());
        return File(resume.Content, resume.ContentType, resume.FileName);
    }

    /// <summary>Delete my uploaded resume file. A resume link in the profile is kept.</summary>
    [HttpDelete("resume")]
    [ProducesResponseType(typeof(CandidateProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CandidateProfileDto>> DeleteResume()
    {
        return Ok(await _candidateService.DeleteResumeAsync(User.GetUserId()));
    }

    /// <summary>My interviews, newest first. Use upcoming=true for scheduled future interviews only.</summary>
    [HttpGet("interviews")]
    [ProducesResponseType(typeof(List<InterviewDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<InterviewDto>>> GetInterviews([FromQuery] bool upcoming = false)
    {
        return Ok(await _applicationService.GetMyInterviewsAsync(User.GetUserId(), upcoming));
    }
}
