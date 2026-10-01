namespace SkillHireAI.API.Models;

/// <summary>
/// A one-time password reset code sent by email. Only a hash of the code is stored.
/// A token can be used once; it stops working when it expires, is used, or gets too many wrong tries.
/// </summary>
public class PasswordResetToken
{
    public int Id { get; set; }
    public int UserId { get; set; }

    /// <summary>SHA-256 hash of the code (hex). The plain code is only ever in the email.</summary>
    public string CodeHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }

    /// <summary>Set when the code was checked successfully on the "enter code" step.</summary>
    public DateTime? VerifiedAt { get; set; }

    /// <summary>Set when the password was reset with this code, or when the code was replaced or locked.</summary>
    public DateTime? UsedAt { get; set; }

    public int FailedAttempts { get; set; }

    public User User { get; set; } = null!;
}
