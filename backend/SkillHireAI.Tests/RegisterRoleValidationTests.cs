using System.ComponentModel.DataAnnotations;
using SkillHireAI.API.DTOs.Auth;

namespace SkillHireAI.Tests;

public class RegisterRoleValidationTests
{
    private static RegisterRequestDto Request(string role, string? companyName = "Acme Corp") => new()
    {
        Name = "Test User",
        Email = "test@example.com",
        Password = "Password123",
        ConfirmPassword = "Password123",
        Role = role,
        CompanyName = companyName
    };

    private static List<ValidationResult> Validate(RegisterRequestDto request)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(request, new ValidationContext(request), results, validateAllProperties: true);
        return results;
    }

    [Theory]
    [InlineData("Recruiter")]
    [InlineData("Candidate")]
    public void SelfServiceRoles_AreValid(string role)
    {
        Assert.Empty(Validate(Request(role)));
    }

    [Theory]
    [InlineData("Admin")]
    [InlineData("recruiter")]
    [InlineData("Manager")]
    [InlineData("")]
    public void OtherRoles_AreRejected(string role)
    {
        Assert.Contains(Validate(Request(role)), r => r.MemberNames.Contains(nameof(RegisterRequestDto.Role)));
    }

    [Fact]
    public void Recruiter_WithoutCompanyName_IsInvalid()
    {
        var results = Validate(Request("Recruiter", companyName: " "));

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(RegisterRequestDto.CompanyName)));
    }

    [Fact]
    public void Candidate_WithoutCompanyName_IsValid()
    {
        Assert.Empty(Validate(Request("Candidate", companyName: null)));
    }

    [Theory]
    [InlineData("Recruiter", true)]
    [InlineData("Employer", true)]
    [InlineData("Candidate", false)]
    public void IsRecruiter_AcceptsTheOldEmployerName(string role, bool expected)
    {
        Assert.Equal(expected, Request(role).IsRecruiter());
    }

    [Fact]
    public void LegacyEmployer_StillNeedsCompanyName()
    {
        var results = Validate(Request("Employer", companyName: null));

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(RegisterRequestDto.CompanyName)));
    }
}
