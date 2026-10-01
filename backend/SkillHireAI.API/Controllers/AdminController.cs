using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillHireAI.API.DTOs.Admin;
using SkillHireAI.API.DTOs.Jobs;
using SkillHireAI.API.Models;
using SkillHireAI.API.Services;

namespace SkillHireAI.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = nameof(UserRole.Admin))]
[Produces("application/json")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    /// <summary>Platform-wide user and job counts plus the oldest pending jobs.</summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(AdminDashboardDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminDashboardDto>> GetDashboard()
    {
        return Ok(await _adminService.GetDashboardAsync());
    }

    /// <summary>List all users, optionally filtered by role or a name/email search.</summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(List<AdminUserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AdminUserDto>>> GetUsers([FromQuery] UserRole? role, [FromQuery] string? search)
    {
        return Ok(await _adminService.GetUsersAsync(role, search));
    }

    /// <summary>List employers with their company details.</summary>
    [HttpGet("employers")]
    [ProducesResponseType(typeof(List<AdminEmployerDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AdminEmployerDto>>> GetEmployers([FromQuery] string? search)
    {
        return Ok(await _adminService.GetEmployersAsync(search));
    }

    /// <summary>List candidates with their profile details.</summary>
    [HttpGet("candidates")]
    [ProducesResponseType(typeof(List<AdminCandidateDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AdminCandidateDto>>> GetCandidates([FromQuery] string? search)
    {
        return Ok(await _adminService.GetCandidatesAsync(search));
    }

    /// <summary>List all jobs. Use status=Pending for the review queue.</summary>
    [HttpGet("jobs")]
    [ProducesResponseType(typeof(List<JobDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<JobDto>>> GetJobs([FromQuery] JobStatus? status, [FromQuery] string? search)
    {
        return Ok(await _adminService.GetJobsAsync(status, search));
    }

    /// <summary>Shortcut for the pending review queue.</summary>
    [HttpGet("jobs/pending")]
    [ProducesResponseType(typeof(List<JobDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<JobDto>>> GetPendingJobs()
    {
        return Ok(await _adminService.GetJobsAsync(JobStatus.Pending, null));
    }

    /// <summary>Get any job by id.</summary>
    [HttpGet("jobs/{id:int}")]
    [ProducesResponseType(typeof(JobDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<JobDto>> GetJob(int id)
    {
        return Ok(await _adminService.GetJobAsync(id));
    }

    /// <summary>Approve a pending job so candidates can see it.</summary>
    [HttpPatch("jobs/{id:int}/approve")]
    [ProducesResponseType(typeof(JobDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<JobDto>> Approve(int id)
    {
        return Ok(await _adminService.ApproveJobAsync(id));
    }

    /// <summary>Reject a pending job with a reason the employer can see.</summary>
    [HttpPatch("jobs/{id:int}/reject")]
    [ProducesResponseType(typeof(JobDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<JobDto>> Reject(int id, RejectJobDto request)
    {
        return Ok(await _adminService.RejectJobAsync(id, request.Reason));
    }
}
