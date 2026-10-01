using System.ComponentModel.DataAnnotations;

namespace SkillHireAI.API.DTOs.Auth;

public class ForgotPasswordRequestDto
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;
}

public class VerifyOtpRequestDto
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Enter the 6-digit code from the email.")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "The code must be exactly 6 digits.")]
    public string Otp { get; set; } = string.Empty;
}

public class ResetPasswordRequestDto
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Enter the 6-digit code from the email.")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "The code must be exactly 6 digits.")]
    public string Otp { get; set; } = string.Empty;

    // Same rules as registration.
    [Required]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters long.")]
    [RegularExpression(@"^(?=.*[A-Za-z])(?=.*\d).+$", ErrorMessage = "Password must contain at least one letter and one number.")]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [Compare(nameof(NewPassword), ErrorMessage = "Passwords do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}

/// <summary>A plain confirmation message. Never contains the code or a password.</summary>
public class MessageResponseDto
{
    public string Message { get; set; } = string.Empty;
}

public class VerifyOtpResponseDto
{
    public string Message { get; set; } = string.Empty;

    /// <summary>When the code stops working, so the page can tell the user how long they have.</summary>
    public DateTime ExpiresAt { get; set; }
}
