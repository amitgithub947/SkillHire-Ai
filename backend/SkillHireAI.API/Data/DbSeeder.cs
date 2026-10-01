using Microsoft.EntityFrameworkCore;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Data;

public static class DbSeeder
{
    // Admins cannot self-register, so the first admin comes from configuration.
    public static async Task SeedAdminAsync(ApplicationDbContext db, IConfiguration config, ILogger logger)
    {
        var email = config["AdminSeed:Email"]?.Trim().ToLowerInvariant();
        var password = config["AdminSeed:Password"];
        var name = config["AdminSeed:Name"] ?? "Administrator";

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogInformation("AdminSeed is not configured; skipping admin seeding.");
            return;
        }

        if (await db.Users.AnyAsync(u => u.Email == email))
        {
            return;
        }

        db.Users.Add(new User
        {
            Name = name,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRole.Admin
        });

        await db.SaveChangesAsync();
        logger.LogInformation("Seeded admin user {Email}.", email);
    }
}
