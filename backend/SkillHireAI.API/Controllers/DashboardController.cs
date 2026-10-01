using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillHireAI.API.Models;
using SkillHireAI.API.Services;

namespace SkillHireAI.API.Controllers;

/// <summary>
/// One endpoint per role, used by the React dashboards to confirm the
/// role-based authorization works end to end. Real features come later.
/// </summary>
[ApiController]
[Route("api/dashboard")]
[Produces("application/json")]
public class DashboardController : ControllerBase
{
    [HttpGet("admin")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public IActionResult Admin() => Ok(Welcome("Admin"));

    [HttpGet("employer")]
    [Authorize(Roles = nameof(UserRole.Employer))]
    public IActionResult Employer() => Ok(Welcome("Employer"));

    [HttpGet("candidate")]
    [Authorize(Roles = nameof(UserRole.Candidate))]
    public IActionResult Candidate() => Ok(Welcome("Candidate"));

    private object Welcome(string role) => new
    {
        message = $"Welcome to the {role} dashboard.",
        userId = User.GetUserId(),
        email = User.FindFirst(AppClaimTypes.Email)?.Value,
        role
    };
}
