using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillHireAI.API.DTOs.Employers;
using SkillHireAI.API.Models;
using SkillHireAI.API.Services;

namespace SkillHireAI.API.Controllers;

[ApiController]
[Route("api/employer")]
[Authorize(Roles = nameof(UserRole.Employer))]
[Produces("application/json")]
public class EmployerController : ControllerBase
{
    private readonly IEmployerService _employerService;

    public EmployerController(IEmployerService employerService)
    {
        _employerService = employerService;
    }

    /// <summary>Job counts and recent jobs for the logged-in employer.</summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(EmployerDashboardDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EmployerDashboardDto>> GetDashboard()
    {
        return Ok(await _employerService.GetDashboardAsync(User.GetUserId()));
    }

    /// <summary>Get the logged-in employer's company profile.</summary>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(EmployerProfileDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EmployerProfileDto>> GetProfile()
    {
        return Ok(await _employerService.GetProfileAsync(User.GetUserId()));
    }

    /// <summary>Update the logged-in employer's company profile.</summary>
    [HttpPut("profile")]
    [ProducesResponseType(typeof(EmployerProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmployerProfileDto>> UpdateProfile(UpdateEmployerProfileDto request)
    {
        return Ok(await _employerService.UpdateProfileAsync(User.GetUserId(), request));
    }
}
