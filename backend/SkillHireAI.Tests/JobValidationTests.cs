using System.ComponentModel.DataAnnotations;
using SkillHireAI.API.DTOs.Jobs;

namespace SkillHireAI.Tests;

public class JobValidationTests
{
    private static CreateJobDto ValidJob() => new()
    {
        Title = "Backend Developer",
        Description = "Build and maintain ASP.NET Core APIs for our hiring platform.",
        Requirements = "2+ years of C# and SQL Server.",
        Skills = "C#, ASP.NET Core, SQL",
        Location = "Bengaluru",
        SalaryMin = 600000,
        SalaryMax = 900000,
        ExperienceRequired = 2
    };

    private static List<ValidationResult> Validate(CreateJobDto job)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(job, new ValidationContext(job), results, validateAllProperties: true);
        return results;
    }

    private static bool HasErrorFor(List<ValidationResult> results, string member) =>
        results.Any(r => r.MemberNames.Contains(member));

    [Fact]
    public void ValidJob_HasNoErrors()
    {
        Assert.Empty(Validate(ValidJob()));
    }

    [Theory]
    [InlineData("")]
    [InlineData("ab")]
    public void Title_TooShortOrEmpty_IsInvalid(string title)
    {
        var job = ValidJob();
        job.Title = title;

        Assert.True(HasErrorFor(Validate(job), nameof(CreateJobDto.Title)));
    }

    [Fact]
    public void Title_Over200Characters_IsInvalid()
    {
        var job = ValidJob();
        job.Title = new string('a', 201);

        Assert.True(HasErrorFor(Validate(job), nameof(CreateJobDto.Title)));
    }

    [Theory]
    [InlineData(3)]
    [InlineData(200)]
    public void Title_AtLengthLimits_IsValid(int length)
    {
        var job = ValidJob();
        job.Title = new string('a', length);

        Assert.False(HasErrorFor(Validate(job), nameof(CreateJobDto.Title)));
    }

    [Theory]
    [InlineData(nameof(CreateJobDto.Description), "Too short")]
    [InlineData(nameof(CreateJobDto.Requirements), "Short")]
    public void RequiredText_TooShort_IsInvalid(string field, string value)
    {
        var job = ValidJob();
        typeof(CreateJobDto).GetProperty(field)!.SetValue(job, value);

        Assert.True(HasErrorFor(Validate(job), field));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(51)]
    public void Experience_OutsideZeroToFifty_IsInvalid(int years)
    {
        var job = ValidJob();
        job.ExperienceRequired = years;

        Assert.True(HasErrorFor(Validate(job), nameof(CreateJobDto.ExperienceRequired)));
    }

    [Fact]
    public void SalaryMax_LessThanSalaryMin_IsInvalid()
    {
        var job = ValidJob();
        job.SalaryMin = 900000;
        job.SalaryMax = 600000;

        Assert.True(HasErrorFor(Validate(job), nameof(CreateJobDto.SalaryMax)));
    }

    [Fact]
    public void Salary_Missing_IsValid()
    {
        var job = ValidJob();
        job.SalaryMin = null;
        job.SalaryMax = null;

        Assert.Empty(Validate(job));
    }
}
