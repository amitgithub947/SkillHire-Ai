using Microsoft.EntityFrameworkCore;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Employer> Employers => Set<Employer>();
    public DbSet<Candidate> Candidates => Set<Candidate>();
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<Interview> Interviews => Set<Interview>();
    public DbSet<ResumeAnalysis> ResumeAnalyses => Set<ResumeAnalysis>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(u => u.Name).HasMaxLength(100).IsRequired();
            entity.Property(u => u.Email).HasMaxLength(256).IsRequired();
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);

            // One-to-one: User -> Employer profile
            entity.HasOne(u => u.Employer)
                .WithOne(e => e.User)
                .HasForeignKey<Employer>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // One-to-one: User -> Candidate profile
            entity.HasOne(u => u.Candidate)
                .WithOne(c => c.User)
                .HasForeignKey<Candidate>(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Employer>(entity =>
        {
            entity.Property(e => e.CompanyName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.CompanyDescription).HasMaxLength(2000);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.Website).HasMaxLength(300);
            entity.Property(e => e.LogoUrl).HasMaxLength(500);

            entity.HasMany(e => e.Jobs)
                .WithOne(j => j.Employer)
                .HasForeignKey(j => j.EmployerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Candidate>(entity =>
        {
            entity.Property(c => c.Phone).HasMaxLength(30);
            entity.Property(c => c.Location).HasMaxLength(200);
            entity.Property(c => c.ResumeUrl).HasMaxLength(500);

            entity.HasMany(c => c.Applications)
                .WithOne(a => a.Candidate)
                .HasForeignKey(a => a.CandidateId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(c => c.ResumeAnalyses)
                .WithOne(r => r.Candidate)
                .HasForeignKey(r => r.CandidateId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Job>(entity =>
        {
            entity.Property(j => j.Title).HasMaxLength(200).IsRequired();
            entity.Property(j => j.Description).IsRequired();
            entity.Property(j => j.Requirements).IsRequired();
            entity.Property(j => j.Location).HasMaxLength(200);
            entity.Property(j => j.SalaryMin).HasPrecision(18, 2);
            entity.Property(j => j.SalaryMax).HasPrecision(18, 2);
            entity.Property(j => j.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(j => j.RejectionReason).HasMaxLength(500);
            entity.HasIndex(j => j.Status);

            // SQL Server rejects two cascade paths from Users to Applications
            // (via Employer -> Job and via Candidate), so this side is Restrict.
            entity.HasMany(j => j.Applications)
                .WithOne(a => a.Job)
                .HasForeignKey(a => a.JobId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Application>(entity =>
        {
            entity.Property(a => a.Status).HasConversion<string>().HasMaxLength(30);

            // A candidate can apply to the same job only once.
            entity.HasIndex(a => new { a.JobId, a.CandidateId }).IsUnique();

            entity.HasMany(a => a.Interviews)
                .WithOne(i => i.Application)
                .HasForeignKey(i => i.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Interview>(entity =>
        {
            entity.Property(i => i.Type).HasConversion<string>().HasMaxLength(20);
            entity.Property(i => i.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(i => i.MeetingLink).HasMaxLength(500);
        });
    }
}
