using SkillHireAI.API.Models;
using SkillHireAI.API.Services;

namespace SkillHireAI.Tests;

public class ApplicationStatusRulesTests
{
    [Theory]
    [InlineData(ApplicationStatus.Applied, true)]
    [InlineData(ApplicationStatus.Shortlisted, false)]
    [InlineData(ApplicationStatus.InterviewScheduled, false)]
    [InlineData(ApplicationStatus.Selected, false)]
    [InlineData(ApplicationStatus.Rejected, false)]
    public void CanShortlist_OnlyFromApplied(ApplicationStatus current, bool expected)
    {
        Assert.Equal(expected, ApplicationStatusRules.CanShortlist(current));
    }

    [Theory]
    [InlineData(ApplicationStatus.Applied, true)]
    [InlineData(ApplicationStatus.Shortlisted, true)]
    [InlineData(ApplicationStatus.InterviewScheduled, true)]
    [InlineData(ApplicationStatus.Selected, false)]
    [InlineData(ApplicationStatus.Rejected, false)]
    public void CanReject_FromAnyActiveStatus(ApplicationStatus current, bool expected)
    {
        Assert.Equal(expected, ApplicationStatusRules.CanReject(current));
    }

    [Theory]
    [InlineData(ApplicationStatus.Applied, false)]
    [InlineData(ApplicationStatus.Shortlisted, true)]
    [InlineData(ApplicationStatus.InterviewScheduled, true)]
    [InlineData(ApplicationStatus.Selected, false)]
    [InlineData(ApplicationStatus.Rejected, false)]
    public void CanSelect_OnlyAfterShortlistOrInterview(ApplicationStatus current, bool expected)
    {
        Assert.Equal(expected, ApplicationStatusRules.CanSelect(current));
    }

    [Theory]
    [InlineData(ApplicationStatus.Applied, true)]
    [InlineData(ApplicationStatus.Shortlisted, true)]
    [InlineData(ApplicationStatus.InterviewScheduled, true)]
    [InlineData(ApplicationStatus.Selected, false)]
    [InlineData(ApplicationStatus.Rejected, false)]
    public void CanScheduleInterview_FromAnyActiveStatus(ApplicationStatus current, bool expected)
    {
        Assert.Equal(expected, ApplicationStatusRules.CanScheduleInterview(current));
    }

    [Theory]
    [InlineData(ApplicationStatus.Applied, true)]
    [InlineData(ApplicationStatus.Shortlisted, false)]
    [InlineData(ApplicationStatus.InterviewScheduled, false)]
    [InlineData(ApplicationStatus.Selected, false)]
    [InlineData(ApplicationStatus.Rejected, false)]
    public void CanCandidateChange_OnlyBeforeEmployerReview(ApplicationStatus current, bool expected)
    {
        Assert.Equal(expected, ApplicationStatusRules.CanCandidateChange(current));
    }

    [Theory]
    [InlineData(ApplicationStatus.Selected)]
    [InlineData(ApplicationStatus.Rejected)]
    public void FinalStatuses_AllowNoEmployerAction(ApplicationStatus final)
    {
        Assert.False(ApplicationStatusRules.CanShortlist(final));
        Assert.False(ApplicationStatusRules.CanReject(final));
        Assert.False(ApplicationStatusRules.CanSelect(final));
        Assert.False(ApplicationStatusRules.CanScheduleInterview(final));
    }
}
