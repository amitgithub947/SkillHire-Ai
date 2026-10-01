using SkillHireAI.API.DTOs.Auth;

namespace SkillHireAI.API.Services;

/// <summary>Forgot-password flow for Employer and Candidate accounts. Admins cannot use it.</summary>
public interface IPasswordResetService
{
    Task<MessageResponseDto> RequestCodeAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken = default);
    Task<VerifyOtpResponseDto> VerifyCodeAsync(VerifyOtpRequestDto request, CancellationToken cancellationToken = default);
    Task<MessageResponseDto> ResetPasswordAsync(ResetPasswordRequestDto request, CancellationToken cancellationToken = default);
}
