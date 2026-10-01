namespace SkillHireAI.API.Middleware;

/// <summary>
/// Throw from services for expected errors (bad input, conflicts, wrong credentials).
/// The exception middleware turns it into a JSON error with the given status code.
/// </summary>
public class AppException : Exception
{
    public int StatusCode { get; }

    public AppException(string message, int statusCode = StatusCodes.Status400BadRequest)
        : base(message)
    {
        StatusCode = statusCode;
    }

    public static AppException Conflict(string message) => new(message, StatusCodes.Status409Conflict);
    public static AppException Unauthorized(string message) => new(message, StatusCodes.Status401Unauthorized);
    public static AppException NotFound(string message) => new(message, StatusCodes.Status404NotFound);
}
