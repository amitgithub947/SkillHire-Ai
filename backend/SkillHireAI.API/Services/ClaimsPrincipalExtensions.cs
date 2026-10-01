using System.Security.Claims;

namespace SkillHireAI.API.Services;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(AppClaimTypes.UserId);
        return int.TryParse(value, out var id)
            ? id
            : throw new InvalidOperationException("The token does not contain a valid userId claim.");
    }
}
