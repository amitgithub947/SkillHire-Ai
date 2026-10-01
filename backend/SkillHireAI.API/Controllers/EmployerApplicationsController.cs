using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillHireAI.API.DTOs.Applications;
using SkillHireAI.API.DTOs.Interviews;
using SkillHireAI.API.Models;
using SkillHireAI.API.Services;

namespace SkillHireAI.API.Controllers;

/// <summary>Applications to the logged-in employer's jobs, and their interviews.</summary>
[ApiController]
[Route("api/employer")]
[Authorize(Roles = nameof(UserRole.Employer))]
[Produces("application/json")]
public class EmployerApplicationsController : ControllerBase
{
    private readonly IEmployerApplicationService _applicationService;

    public EmployerApplicationsController(IEmployerApplicationService applicationService)
    {
        _applicationService = applicationService;
    }

    /// <summary>List applications to my jobs. Filter by job, status, or search candidate name, email or skills.</summary>
    [HttpGet("applications")]
    [ProducesResponseType(typeof(List<EmployerApplicationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<EmployerApplicationDto>>> GetApplications(
        [FromQuery] int? jobId, [FromQuery] ApplicationStatus? status, [FromQuery] string? search)
    {
        return Ok(await _applicationService.GetApplicationsAsync(User.GetUserId(), jobId, status, search));
    }

    /// <summary>One application with the candidate's full profile and interviews.</summary>
    [HttpGet("applications/{id:int}")]
    [ProducesResponseType(typeof(EmployerApplicationDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployerApplicationDetailsDto>> GetApplication(int id)
    {
        return Ok(await _applicationService.GetApplicationAsync(User.GetUserId(), id));
    }

    /// <summary>Download the applicant's uploaded resume.</summary>
    [HttpGet("applications/{id:int}/resume")]
    [Produces("application/octet-stream", "application/problem+json")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetResume(int id)
    {
        var resume = await _applicationService.GetResumeAsync(User.GetUserId(), id);
        return File(resume.Content, resume.ContentType, resume.FileName);
    }

    /// <summary>Shortlist an application (only from Applied).</summary>
    [HttpPatch("applications/{id:int}/shortlist")]
    [ProducesResponseType(typeof(EmployerApplicationDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EmployerApplicationDetailsDto>> Shortlist(int id)
    {
        return Ok(await _applicationService.ShortlistAsync(User.GetUserId(), id));
    }

    /// <summary>Reject an application. Any scheduled interviews are cancelled.</summary>
    [HttpPatch("applications/{id:int}/reject")]
    [ProducesResponseType(typeof(EmployerApplicationDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EmployerApplicationDetailsDto>> Reject(int id)
    {
        return Ok(await _applicationService.RejectAsync(User.GetUserId(), id));
    }

    /// <summary>Select (hire) a shortlisted or interviewed candidate.</summary>
    [HttpPatch("applications/{id:int}/select")]
    [ProducesResponseType(typeof(EmployerApplicationDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EmployerApplicationDetailsDto>> Select(int id)
    {
        return Ok(await _applicationService.SelectAsync(User.GetUserId(), id));
    }

    /// <summary>Schedule an interview. The application moves to InterviewScheduled.</summary>
    [HttpPost("applications/{id:int}/interviews")]
    [ProducesResponseType(typeof(InterviewDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<InterviewDto>> ScheduleInterview(int id, ScheduleInterviewDto request)
    {
        var interview = await _applicationService.ScheduleInterviewAsync(User.GetUserId(), id, request);
        return Created($"/api/employer/interviews/{interview.Id}", interview);
    }

    /// <summary>Interviews for my jobs. Use upcoming=true for scheduled future interviews only.</summary>
    [HttpGet("interviews")]
    [ProducesResponseType(typeof(List<InterviewDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<InterviewDto>>> GetInterviews([FromQuery] bool upcoming = false)
    {
        return Ok(await _applicationService.GetInterviewsAsync(User.GetUserId(), upcoming));
    }

    /// <summary>Mark a scheduled interview as Completed or Cancelled, with optional feedback.</summary>
    [HttpPatch("interviews/{id:int}")]
    [ProducesResponseType(typeof(InterviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<InterviewDto>> UpdateInterviewStatus(int id, UpdateInterviewStatusDto request)
    {
        return Ok(await _applicationService.UpdateInterviewStatusAsync(User.GetUserId(), id, request));
    }
}
