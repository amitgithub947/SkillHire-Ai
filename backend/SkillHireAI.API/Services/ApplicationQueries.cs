using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SkillHireAI.API.DTOs.Applications;
using SkillHireAI.API.DTOs.Interviews;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services;

/// <summary>Application and interview queries shared by the candidate and employer services.</summary>
public static class ApplicationQueries
{
    public static readonly Expression<Func<Interview, InterviewDto>> ToInterviewDto = i => new InterviewDto
    {
        Id = i.Id,
        ApplicationId = i.ApplicationId,
        JobId = i.Application.JobId,
        JobTitle = i.Application.Job.Title,
        CompanyName = i.Application.Job.Employer.CompanyName,
        CandidateName = i.Application.Candidate.User.Name,
        InterviewDate = i.InterviewDate,
        Type = i.Type,
        MeetingLink = i.MeetingLink,
        Notes = i.Notes,
        Status = i.Status,
        Feedback = i.Feedback,
        CreatedAt = i.CreatedAt
    };

    public static async Task<ApplicationStatsDto> GetStatsAsync(IQueryable<Application> applications)
    {
        var counts = await applications
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count);

        int CountOf(ApplicationStatus status) => counts.GetValueOrDefault(status);

        return new ApplicationStatsDto
        {
            Total = counts.Values.Sum(),
            Applied = CountOf(ApplicationStatus.Applied),
            Shortlisted = CountOf(ApplicationStatus.Shortlisted),
            InterviewScheduled = CountOf(ApplicationStatus.InterviewScheduled),
            Selected = CountOf(ApplicationStatus.Selected),
            Rejected = CountOf(ApplicationStatus.Rejected)
        };
    }

    /// <summary>Loads interviews for several applications at once, newest first, grouped by application.</summary>
    public static async Task<Dictionary<int, List<InterviewDto>>> GetInterviewsByApplicationAsync(
        this IQueryable<Interview> interviews, IReadOnlyCollection<int> applicationIds)
    {
        if (applicationIds.Count == 0)
        {
            return [];
        }

        var list = await interviews
            .Where(i => applicationIds.Contains(i.ApplicationId))
            .OrderByDescending(i => i.InterviewDate)
            .Select(ToInterviewDto)
            .ToListAsync();

        return list.GroupBy(i => i.ApplicationId).ToDictionary(g => g.Key, g => g.ToList());
    }

    /// <summary>Feedback is the employer's assessment; candidates only see it once the interview is completed.</summary>
    public static InterviewDto ForCandidate(this InterviewDto interview)
    {
        if (interview.Status != InterviewStatus.Completed)
        {
            interview.Feedback = null;
        }

        return interview;
    }

    public static bool HasResume(Candidate candidate) =>
        !string.IsNullOrEmpty(candidate.ResumeStoredName) || !string.IsNullOrWhiteSpace(candidate.ResumeUrl);
}
