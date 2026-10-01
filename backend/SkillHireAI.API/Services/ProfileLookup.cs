using Microsoft.EntityFrameworkCore;
using SkillHireAI.API.Data;
using SkillHireAI.API.Middleware;

namespace SkillHireAI.API.Services;

/// <summary>Turns the logged-in user's id (from the JWT) into their profile id.</summary>
public static class ProfileLookup
{
    public static async Task<int> GetCandidateIdAsync(this ApplicationDbContext db, int userId)
    {
        var candidateId = await db.Candidates
            .Where(c => c.UserId == userId)
            .Select(c => (int?)c.Id)
            .SingleOrDefaultAsync();

        return candidateId ?? throw AppException.NotFound("Candidate profile not found.");
    }

    public static async Task<int> GetEmployerIdAsync(this ApplicationDbContext db, int userId)
    {
        var employerId = await db.Employers
            .Where(e => e.UserId == userId)
            .Select(e => (int?)e.Id)
            .SingleOrDefaultAsync();

        return employerId ?? throw AppException.NotFound("Employer profile not found.");
    }
}
