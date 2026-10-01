using SkillHireAI.API.DTOs.Auth;

namespace SkillHireAI.API.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<UserDto> GetUserAsync(int userId);
}
