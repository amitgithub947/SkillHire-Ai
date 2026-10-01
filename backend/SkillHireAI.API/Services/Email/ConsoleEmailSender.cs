namespace SkillHireAI.API.Services.Email;

/// <summary>
/// Used when no SMTP server is configured. In Development the email is written to the API
/// console so the flow can be tested locally. Elsewhere the content is never logged,
/// because it may contain a reset code.
/// </summary>
public class ConsoleEmailSender : IEmailSender
{
    private readonly ILogger<ConsoleEmailSender> _logger;
    private readonly IHostEnvironment _env;

    public ConsoleEmailSender(ILogger<ConsoleEmailSender> logger, IHostEnvironment env)
    {
        _logger = logger;
        _env = env;
    }

    public Task SendAsync(string toAddress, string subject, string body, CancellationToken cancellationToken = default)
    {
        if (_env.IsDevelopment())
        {
            _logger.LogWarning(
                "DEVELOPMENT EMAIL (no SMTP configured)\n  To: {To}\n  Subject: {Subject}\n  {Body}",
                toAddress, subject, body);
        }
        else
        {
            _logger.LogError("Email is not configured (Email:SmtpHost is empty), so an email could not be sent.");
        }

        return Task.CompletedTask;
    }
}
