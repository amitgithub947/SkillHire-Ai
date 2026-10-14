using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

/// <summary>
/// Which application statuses each action is allowed from. Selected and Rejected are final.
/// </summary>
public static class ApplicationStatusRules
{
    public static bool CanShortlist(ApplicationStatus current) =>
        current is ApplicationStatus.Applied;

    public static bool CanReject(ApplicationStatus current) =>
        current is ApplicationStatus.Applied or ApplicationStatus.Shortlisted or ApplicationStatus.InterviewScheduled;

    public static bool CanSelect(ApplicationStatus current) =>
        current is ApplicationStatus.Shortlisted or ApplicationStatus.InterviewScheduled;

    public static bool CanScheduleInterview(ApplicationStatus current) =>
        current is ApplicationStatus.Applied or ApplicationStatus.Shortlisted or ApplicationStatus.InterviewScheduled;

    /// <summary>Candidates can edit or withdraw only before the employer has reviewed the application.</summary>
    public static bool CanCandidateChange(ApplicationStatus current) =>
        current is ApplicationStatus.Applied;
}
