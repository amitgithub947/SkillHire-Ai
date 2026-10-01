namespace SkillHireAI.API.Models;

public enum UserRole
{
    Admin,
    Employer,
    Candidate
}

public enum JobStatus
{
    Pending,
    Approved,
    Rejected,
    Closed
}

public enum ApplicationStatus
{
    Applied,
    Shortlisted,
    Rejected,
    InterviewScheduled,
    Selected
}

public enum InterviewType
{
    Online,
    InPerson,
    Phone
}

public enum InterviewStatus
{
    Scheduled,
    Completed,
    Cancelled
}
