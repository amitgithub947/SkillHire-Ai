namespace SkillHireAI.API.Services.Email;

/// <summary>Emails candidates about their interviews.</summary>
public interface IInterviewNotifier
{
    /// <summary>Sends the "interview scheduled" email. Returns false if it could not be sent.</summary>
    Task<bool> SendScheduledAsync(int interviewId, CancellationToken cancellationToken = default);

    /// <summary>Sends the "interview cancelled" email. Returns false if it could not be sent.</summary>
    Task<bool> SendCancelledAsync(int interviewId, CancellationToken cancellationToken = default);
}
