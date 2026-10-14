using SkillHireAI.API.Services;

namespace SkillHireAI.Tests;

public class SkillMatchCalculatorTests
{
    [Theory]
    [InlineData("C#, SQL, Azure", "C#, SQL, Azure", 100)]
    [InlineData("C#, SQL", "C#, SQL, Azure, Docker", 50)]
    [InlineData("C#", "C#, SQL, Azure", 33)]
    [InlineData("C#, SQL", "C#, SQL, Azure", 67)]
    [InlineData("React, CSS", "C#, SQL", 0)]
    [InlineData(null, "C#, SQL", 0)]
    public void Calculate_ReturnsShareOfJobSkillsTheCandidateHas(string? candidate, string job, int expected)
    {
        Assert.Equal(expected, SkillMatchCalculator.Calculate(candidate, job).Percentage);
    }

    [Fact]
    public void Calculate_ExtraCandidateSkills_DoNotRaiseThePercentage()
    {
        var result = SkillMatchCalculator.Calculate("C#, SQL, React, Docker, Python", "C#, SQL");

        Assert.Equal(100, result.Percentage);
    }

    [Fact]
    public void Calculate_IgnoresCaseSpacesAndDuplicates()
    {
        var result = SkillMatchCalculator.Calculate("  c# , sql ,SQL", "C#, SQL, sql");

        Assert.Equal(100, result.Percentage);
        Assert.Equal(["C#", "SQL"], result.MatchedSkills);
    }

    [Fact]
    public void Calculate_ListsMatchedAndMissingSkills()
    {
        var result = SkillMatchCalculator.Calculate("C#, React", "C#, SQL, React, Azure");

        Assert.Equal(["C#", "React"], result.MatchedSkills);
        Assert.Equal(["SQL", "Azure"], result.MissingSkills);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" , ,")]
    public void Calculate_JobWithNoSkills_ReturnsZero(string? jobSkills)
    {
        var result = SkillMatchCalculator.Calculate("C#, SQL", jobSkills);

        Assert.Equal(0, result.Percentage);
        Assert.Empty(result.MatchedSkills);
        Assert.Empty(result.MissingSkills);
    }
}
