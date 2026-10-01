using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillHireAI.API.DTOs.Common;
using SkillHireAI.API.DTOs.Jobs;
using SkillHireAI.API.Models;
using SkillHireAI.API.Services;

namespace SkillHireAI.API.Controllers;

/// <summary>Browse and search approved jobs.</summary>
[ApiController]
[Route("api/candidate/jobs")]
[Authorize(Roles = nameof(UserRole.Candidate))]
[Produces("application/json")]
public class CandidateJobsController : ControllerBase
{
    private readonly ICandidateJobService _jobService;

    public CandidateJobsController(ICandidateJobService jobService)
    {
        _jobService = jobService;
    }

    /// <summary>Search approved jobs by keyword, location, experience and skills (paged, newest first).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<JobListingDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<JobListingDto>>> Search([FromQuery] JobSearchQuery query)
    {
        return Ok(await _jobService.SearchAsync(User.GetUserId(), query));
    }

    /// <summary>Details of one approved job, including whether I have applied.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(JobListingDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<JobListingDetailsDto>> Get(int id)
    {
        return Ok(await _jobService.GetAsync(User.GetUserId(), id));
    }
}
