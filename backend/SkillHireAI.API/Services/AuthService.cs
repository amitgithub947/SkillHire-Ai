using Microsoft.EntityFrameworkCore;
using SkillHireAI.API.Data;
using SkillHireAI.API.DTOs.Auth;
using SkillHireAI.API.Middleware;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

public class AuthService : IAuthService
{
    // Verified against when the email is unknown, so a missing account takes
    // about as long to reject as a wrong password.
    private static readonly string DummyHash = BCrypt.Net.BCrypt.HashPassword("dummy-password-for-timing");

    private readonly ApplicationDbContext _db;
    private readonly ITokenService _tokenService;

    public AuthService(ApplicationDbContext db, ITokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        var email = NormalizeEmail(request.Email);

        if (await _db.Users.AnyAsync(u => u.Email == email))
        {
            throw AppException.Conflict("An account with this email already exists.");
        }

        var role = Enum.Parse<UserRole>(request.Role);

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = role
        };

        // Create the matching empty profile so later features can fill it in.
        if (role == UserRole.Employer)
        {
            user.Employer = new Employer { CompanyName = request.CompanyName!.Trim() };
        }
        else
        {
            user.Candidate = new Candidate();
        }

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var email = NormalizeEmail(request.Email);
        var user = await _db.Users.SingleOrDefaultAsync(u => u.Email == email);

        var passwordOk = BCrypt.Net.BCrypt.Verify(request.Password, user?.PasswordHash ?? DummyHash);
        if (user is null || !passwordOk)
        {
            throw AppException.Unauthorized("Invalid email or password.");
        }

        return BuildAuthResponse(user);
    }

    public async Task<UserDto> GetUserAsync(int userId)
    {
        var user = await _db.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == userId)
            ?? throw AppException.NotFound("User not found.");

        return ToUserDto(user);
    }

    private AuthResponseDto BuildAuthResponse(User user)
    {
        var (token, expiresAt) = _tokenService.CreateToken(user);
        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = ToUserDto(user)
        };
    }

    private static UserDto ToUserDto(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Role = user.Role.ToString()
    };

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
