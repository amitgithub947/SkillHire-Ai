using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

public interface ITokenService
{
    (string Token, DateTime ExpiresAt) CreateToken(User user);
}
