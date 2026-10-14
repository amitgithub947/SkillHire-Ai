using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using SkillHireAI.API.Controllers;
using SkillHireAI.API.Models;

namespace SkillHireAI.Tests;

/// <summary>Checks the role each controller requires, so a role can't silently gain access.</summary>
public class RoleAuthorizationTests
{
    private static string? RolesOn(Type controller) =>
        controller.GetCustomAttribute<AuthorizeAttribute>()?.Roles;

    [Theory]
    [InlineData(typeof(EmployerController))]
    [InlineData(typeof(EmployerJobsController))]
    [InlineData(typeof(EmployerApplicationsController))]
    public void RecruiterControllers_RequireOnlyRecruiter(Type controller)
    {
        Assert.Equal(nameof(UserRole.Recruiter), RolesOn(controller));
    }

    [Theory]
    [InlineData(typeof(CandidateController))]
    [InlineData(typeof(CandidateJobsController))]
    [InlineData(typeof(CandidateApplicationsController))]
    [InlineData(typeof(AiController))]
    public void CandidateControllers_RequireOnlyCandidate(Type controller)
    {
        Assert.Equal(nameof(UserRole.Candidate), RolesOn(controller));
    }

    [Fact]
    public void AdminController_RequiresOnlyAdmin()
    {
        Assert.Equal(nameof(UserRole.Admin), RolesOn(typeof(AdminController)));
    }

    [Fact]
    public void AdminController_HasNoActionThatLoosensTheRole()
    {
        var actions = typeof(AdminController).GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly);

        Assert.All(actions, action =>
        {
            Assert.Null(action.GetCustomAttribute<AllowAnonymousAttribute>());
            var roles = action.GetCustomAttribute<AuthorizeAttribute>()?.Roles;
            Assert.True(roles is null || roles == nameof(UserRole.Admin), $"{action.Name} allows {roles}");
        });
    }

    [Fact]
    public void RoleNames_UseRecruiterNotEmployer()
    {
        Assert.Equal(["Admin", "Recruiter", "Candidate"], Enum.GetNames<UserRole>());
    }
}
