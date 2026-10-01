using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SkillHireAI.API.Data;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services.Email;

/// <summary>
/// Builds and sends interview emails. A failed email never undoes the interview change;
/// it is logged and reported back as "not sent".
/// </summary>
public class InterviewNotifier : IInterviewNotifier
{
    private readonly ApplicationDbContext _db;
    private readonly IEmailSender _emailSender;
    private readonly EmailOptions _options;
    private readonly ILogger<InterviewNotifier> _logger;

    public InterviewNotifier(
        ApplicationDbContext db,
        IEmailSender emailSender,
        IOptions<EmailOptions> options,
        ILogger<InterviewNotifier> logger)
    {
        _db = db;
        _emailSender = emailSender;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<bool> SendScheduledAsync(int interviewId, CancellationToken cancellationToken = default)
    {
        var info = await LoadAsync(interviewId, cancellationToken);
        if (info is null)
        {
            return false;
        }

        var body = new StringBuilder()
            .AppendLine($"Hi {info.CandidateName},")
            .AppendLine()
            .AppendLine($"Good news! {info.CompanyName} would like to interview you for the {info.JobTitle} role.")
            .AppendLine()
            .AppendLine($"When:  {FormatTime(info.InterviewDate)}")
            .AppendLine($"Type:  {Describe(info.Type)}");

        if (!string.IsNullOrWhiteSpace(info.MeetingLink))
        {
            body.AppendLine($"Link:  {info.MeetingLink}");
        }

        if (!string.IsNullOrWhiteSpace(info.Notes))
        {
            body.AppendLine().AppendLine("Notes from the employer:").AppendLine(info.Notes);
        }

        body.AppendLine()
            .AppendLine($"You can see all your interviews here: {InterviewsLink()}")
            .AppendLine()
            .AppendLine("Good luck!")
            .AppendLine("The SkillHire AI team");

        return await SendAsync(info, $"Interview scheduled: {info.JobTitle} at {info.CompanyName}", body.ToString(), cancellationToken);
    }

    public async Task<bool> SendCancelledAsync(int interviewId, CancellationToken cancellationToken = default)
    {
        var info = await LoadAsync(interviewId, cancellationToken);
        if (info is null)
        {
            return false;
        }

        var body = new StringBuilder()
            .AppendLine($"Hi {info.CandidateName},")
            .AppendLine()
            .AppendLine($"{info.CompanyName} has cancelled your interview for the {info.JobTitle} role,")
            .AppendLine($"which was planned for {FormatTime(info.InterviewDate)}.")
            .AppendLine()
            .AppendLine("If they schedule a new interview, you will get another email.")
            .AppendLine($"You can check your applications here: {InterviewsLink()}")
            .AppendLine()
            .AppendLine("The SkillHire AI team");

        return await SendAsync(info, $"Interview cancelled: {info.JobTitle} at {info.CompanyName}", body.ToString(), cancellationToken);
    }

    private async Task<bool> SendAsync(InterviewEmailInfo info, string subject, string body, CancellationToken cancellationToken)
    {
        try
        {
            await _emailSender.SendAsync(info.CandidateEmail, OneLine(subject), body, cancellationToken);
            return true;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Could not send the interview email for interview {InterviewId}", info.InterviewId);
            return false;
        }
    }

    private Task<InterviewEmailInfo?> LoadAsync(int interviewId, CancellationToken cancellationToken) =>
        _db.Interviews
            .Where(i => i.Id == interviewId)
            .Select(i => new InterviewEmailInfo
            {
                InterviewId = i.Id,
                CandidateName = i.Application.Candidate.User.Name,
                CandidateEmail = i.Application.Candidate.User.Email,
                JobTitle = i.Application.Job.Title,
                CompanyName = i.Application.Job.Employer.CompanyName,
                InterviewDate = i.InterviewDate,
                Type = i.Type,
                MeetingLink = i.MeetingLink,
                Notes = i.Notes
            })
            .SingleOrDefaultAsync(cancellationToken);

    /// <summary>For example "Monday, 5 October 2026 at 10:30 AM (UTC+05:30)".</summary>
    private string FormatTime(DateTime utc)
    {
        TimeZoneInfo zone;
        try
        {
            zone = TimeZoneInfo.FindSystemTimeZoneById(_options.DisplayTimeZone);
        }
        catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            zone = TimeZoneInfo.Utc;
        }

        var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), zone);
        var offset = zone.GetUtcOffset(local);
        var sign = offset < TimeSpan.Zero ? "-" : "+";
        return local.ToString("dddd, d MMMM yyyy 'at' h:mm tt", CultureInfo.InvariantCulture) +
               $" (UTC{sign}{offset:hh\\:mm})";
    }

    private static string Describe(InterviewType type) => type switch
    {
        InterviewType.Online => "Online (video call)",
        InterviewType.InPerson => "In person",
        InterviewType.Phone => "Phone call",
        _ => type.ToString()
    };

    private string InterviewsLink() => $"{_options.AppBaseUrl.TrimEnd('/')}/candidate/interviews";

    // Line breaks are not allowed in an email subject.
    private static string OneLine(string text) => text.Replace('\r', ' ').Replace('\n', ' ');

    private class InterviewEmailInfo
    {
        public int InterviewId { get; init; }
        public string CandidateName { get; init; } = string.Empty;
        public string CandidateEmail { get; init; } = string.Empty;
        public string JobTitle { get; init; } = string.Empty;
        public string CompanyName { get; init; } = string.Empty;
        public DateTime InterviewDate { get; init; }
        public InterviewType Type { get; init; }
        public string? MeetingLink { get; init; }
        public string? Notes { get; init; }
    }
}
