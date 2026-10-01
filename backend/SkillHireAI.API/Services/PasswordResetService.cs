using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SkillHireAI.API.Data;
using SkillHireAI.API.DTOs.Auth;
using SkillHireAI.API.Middleware;
using SkillHireAI.API.Models;
using SkillHireAI.API.Services.Email;

namespace SkillHireAI.API.Services;

public class PasswordResetService : IPasswordResetService
{
    // Same answer whether or not the email has an account, so nobody can use this
    // page to find out which emails are registered.
    private const string CodeSentMessage =
        "If an employer or candidate account exists for this email, we have sent a 6-digit code to it.";

    private const string InvalidCodeMessage =
        "This code is invalid or has expired. Check the latest email, or request a new code.";

    private readonly ApplicationDbContext _db;
    private readonly IEmailSender _emailSender;
    private readonly PasswordResetOptions _options;
    private readonly ILogger<PasswordResetService> _logger;

    public PasswordResetService(
        ApplicationDbContext db,
        IEmailSender emailSender,
        IOptions<PasswordResetOptions> options,
        ILogger<PasswordResetService> logger)
    {
        _db = db;
        _emailSender = emailSender;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<MessageResponseDto> RequestCodeAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        var response = new MessageResponseDto { Message = CodeSentMessage };
        var user = await FindResettableUserAsync(request.Email, cancellationToken);
        if (user is null)
        {
            return response;
        }

        var now = DateTime.UtcNow;

        var lastCodeAt = await _db.PasswordResetTokens
            .Where(t => t.UserId == user.Id)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => (DateTime?)t.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (lastCodeAt > now.AddSeconds(-_options.ResendCooldownSeconds))
        {
            // A code was sent moments ago; the user should use that one.
            return response;
        }

        // Only the newest code may work, so retire any older ones, and drop old rows while we are here.
        await _db.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.UsedAt, now), cancellationToken);
        await _db.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.ExpiresAt < now.AddDays(-1))
            .ExecuteDeleteAsync(cancellationToken);

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        _db.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = user.Id,
            CodeHash = HashCode(user.Id, code),
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(_options.CodeLifetimeMinutes)
        });
        await _db.SaveChangesAsync(cancellationToken);

        try
        {
            await _emailSender.SendAsync(
                user.Email,
                "Your SkillHire AI password reset code",
                $"Hi {user.Name},\n\n" +
                $"Your password reset code is {code}. It expires in {_options.CodeLifetimeMinutes} minutes.\n\n" +
                "If you did not ask to reset your password, you can ignore this email.",
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Still return the usual message so the response doesn't reveal that the account exists.
            _logger.LogError(ex, "Could not send the password reset email for user {UserId}", user.Id);
        }

        return response;
    }

    public async Task<VerifyOtpResponseDto> VerifyCodeAsync(VerifyOtpRequestDto request, CancellationToken cancellationToken = default)
    {
        var (_, token) = await CheckCodeAsync(request.Email, request.Otp, cancellationToken);

        token.VerifiedAt ??= DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return new VerifyOtpResponseDto
        {
            Message = "Code verified. You can now choose a new password.",
            ExpiresAt = token.ExpiresAt
        };
    }

    public async Task<MessageResponseDto> ResetPasswordAsync(ResetPasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        var (user, token) = await CheckCodeAsync(request.Email, request.Otp, cancellationToken);

        if (BCrypt.Net.BCrypt.Verify(request.NewPassword, user.PasswordHash))
        {
            throw new AppException("Your new password must be different from your current password.");
        }

        // Mark the code as used only if nobody else used it in the meantime (two tabs, double click).
        var now = DateTime.UtcNow;
        var claimed = await _db.PasswordResetTokens
            .Where(t => t.Id == token.Id && t.UsedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.UsedAt, now), cancellationToken);
        if (claimed == 0)
        {
            throw new AppException(InvalidCodeMessage);
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Password was reset for user {UserId}", user.Id);
        return new MessageResponseDto { Message = "Your password has been reset. You can now log in with your new password." };
    }

    /// <summary>
    /// Finds the user's current code and checks it. A wrong code counts as a failed try,
    /// and the code is locked after too many.
    /// </summary>
    private async Task<(User User, PasswordResetToken Token)> CheckCodeAsync(string email, string code, CancellationToken cancellationToken)
    {
        var user = await FindResettableUserAsync(email, cancellationToken)
            ?? throw new AppException(InvalidCodeMessage);

        var now = DateTime.UtcNow;
        var token = await _db.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiresAt > now)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new AppException(InvalidCodeMessage);

        var expected = Convert.FromHexString(token.CodeHash);
        var actual = Convert.FromHexString(HashCode(user.Id, code));
        if (CryptographicOperations.FixedTimeEquals(expected, actual))
        {
            return (user, token);
        }

        token.FailedAttempts++;
        if (token.FailedAttempts >= _options.MaxAttempts)
        {
            token.UsedAt = now;
        }
        await _db.SaveChangesAsync(cancellationToken);

        // Same message as "no such account", so wrong guesses don't reveal which emails are registered.
        throw new AppException(InvalidCodeMessage);
    }

    /// <summary>Only Employer and Candidate accounts can reset their password this way.</summary>
    private async Task<User?> FindResettableUserAsync(string email, CancellationToken cancellationToken)
    {
        var normalized = AuthService.NormalizeEmail(email);
        return await _db.Users.SingleOrDefaultAsync(
            u => u.Email == normalized && (u.Role == UserRole.Employer || u.Role == UserRole.Candidate),
            cancellationToken);
    }

    private static string HashCode(int userId, string code) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{userId}:{code}")));
}
