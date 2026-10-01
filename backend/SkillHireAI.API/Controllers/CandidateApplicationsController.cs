using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillHireAI.API.DTOs.Applications;
using SkillHireAI.API.Models;
using SkillHireAI.API.Services;

namespace SkillHireAI.API.Controllers;

/// <summary>The logged-in candidate's own job applications.</summary>
[ApiController]
[Route("api/candidate/applications")]
[Authorize(Roles = nameof(UserRole.Candidate))]
[Produces("application/json")]
public class CandidateApplicationsController : ControllerBase
{
    private readonly ICandidateApplicationService _applicationService;

    public CandidateApplicationsController(ICandidateApplicationService applicationService)
    {
        _applicationService = applicationService;
    }

    /// <summary>List my applications, optionally filtered by status.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<CandidateApplicationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CandidateApplicationDto>>> GetMine([FromQuery] ApplicationStatus? status)
    {
        return Ok(await _applicationService.GetMyApplicationsAsync(User.GetUserId(), status));
    }

    /// <summary>Get one of my applications with its interviews.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(CandidateApplicationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CandidateApplicationDto>> Get(int id)
    {
        return Ok(await _applicationService.GetMyApplicationAsync(User.GetUserId(), id));
    }

    /// <summary>Apply for an approved job. Each job can be applied for only once.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(CandidateApplicationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CandidateApplicationDto>> Apply(CreateApplicationDto request)
    {
        var application = await _applicationService.ApplyAsync(User.GetUserId(), request);
        return CreatedAtAction(nameof(Get), new { id = application.Id }, application);
    }

    /// <summary>Change my cover letter. Only allowed while the status is Applied.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(CandidateApplicationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CandidateApplicationDto>> Update(int id, UpdateApplicationDto request)
    {
        return Ok(await _applicationService.UpdateAsync(User.GetUserId(), id, request));
    }

    /// <summary>Withdraw my application. Only allowed while the status is Applied.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Withdraw(int id)
    {
        await _applicationService.WithdrawAsync(User.GetUserId(), id);
        return NoContent();
    }
}
