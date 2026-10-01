using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillHireAI.API.DTOs.Jobs;
using SkillHireAI.API.Models;
using SkillHireAI.API.Services;

namespace SkillHireAI.API.Controllers;

/// <summary>An employer's own jobs. Employers can never change a job's approval status.</summary>
[ApiController]
[Route("api/employer/jobs")]
[Authorize(Roles = nameof(UserRole.Employer))]
[Produces("application/json")]
public class EmployerJobsController : ControllerBase
{
    private readonly IEmployerJobService _jobService;

    public EmployerJobsController(IEmployerJobService jobService)
    {
        _jobService = jobService;
    }

    /// <summary>List my jobs, optionally filtered by status.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<JobDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<JobDto>>> GetMyJobs([FromQuery] JobStatus? status)
    {
        return Ok(await _jobService.GetMyJobsAsync(User.GetUserId(), status));
    }

    /// <summary>Get one of my jobs.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(JobDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<JobDto>> GetMyJob(int id)
    {
        return Ok(await _jobService.GetMyJobAsync(User.GetUserId(), id));
    }

    /// <summary>Create a job. It starts as Pending until an admin reviews it.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(JobDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<JobDto>> Create(CreateJobDto request)
    {
        var job = await _jobService.CreateAsync(User.GetUserId(), request);
        return CreatedAtAction(nameof(GetMyJob), new { id = job.Id }, job);
    }

    /// <summary>Edit one of my jobs. Editing an approved or rejected job sends it back to Pending.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(JobDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<JobDto>> Update(int id, UpdateJobDto request)
    {
        return Ok(await _jobService.UpdateAsync(User.GetUserId(), id, request));
    }

    /// <summary>Close one of my jobs so it no longer accepts candidates.</summary>
    [HttpPatch("{id:int}/close")]
    [ProducesResponseType(typeof(JobDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<JobDto>> Close(int id)
    {
        return Ok(await _jobService.CloseAsync(User.GetUserId(), id));
    }
}
