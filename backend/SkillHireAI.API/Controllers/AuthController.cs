using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SkillHireAI.API.DTOs.Auth;
using SkillHireAI.API.Services;

namespace SkillHireAI.API.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    public const string PasswordResetRateLimitPolicy = "password-reset";

    private readonly IAuthService _authService;
    private readonly IPasswordResetService _passwordResetService;

    public AuthController(IAuthService authService, IPasswordResetService passwordResetService)
    {
        _authService = authService;
        _passwordResetService = passwordResetService;
    }

    /// <summary>Create an Employer or Candidate account and return a JWT.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterRequestDto request)
    {
        var response = await _authService.RegisterAsync(request);
        return CreatedAtAction(nameof(Me), response);
    }

    /// <summary>Log in with email and password and return a JWT.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginRequestDto request)
    {
        return Ok(await _authService.LoginAsync(request));
    }

    /// <summary>Return the user that owns the current token.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserDto>> Me()
    {
        return Ok(await _authService.GetUserAsync(User.GetUserId()));
    }

    /// <summary>
    /// Email a 6-digit reset code to an Employer or Candidate account. Always returns the same
    /// message, whether or not the account exists. Admin accounts never get a code.
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting(PasswordResetRateLimitPolicy)]
    [ProducesResponseType(typeof(MessageResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<MessageResponseDto>> ForgotPassword(ForgotPasswordRequestDto request, CancellationToken cancellationToken)
    {
        return Ok(await _passwordResetService.RequestCodeAsync(request, cancellationToken));
    }

    /// <summary>Check a reset code before showing the "new password" form. The code stays usable.</summary>
    [HttpPost("verify-otp")]
    [AllowAnonymous]
    [EnableRateLimiting(PasswordResetRateLimitPolicy)]
    [ProducesResponseType(typeof(VerifyOtpResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<VerifyOtpResponseDto>> VerifyOtp(VerifyOtpRequestDto request, CancellationToken cancellationToken)
    {
        return Ok(await _passwordResetService.VerifyCodeAsync(request, cancellationToken));
    }

    /// <summary>Set a new password using a valid code. The code can only be used once.</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting(PasswordResetRateLimitPolicy)]
    [ProducesResponseType(typeof(MessageResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<MessageResponseDto>> ResetPassword(ResetPasswordRequestDto request, CancellationToken cancellationToken)
    {
        return Ok(await _passwordResetService.ResetPasswordAsync(request, cancellationToken));
    }
}
