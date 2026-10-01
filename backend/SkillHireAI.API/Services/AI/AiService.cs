using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using SkillHireAI.API.Data;
using SkillHireAI.API.DTOs.AI;
using SkillHireAI.API.Middleware;
using SkillHireAI.API.Models;

namespace SkillHireAI.API.Services.AI;

/// <summary>
/// Gathers the data for each AI feature, keeps personal details out of it,
/// calls <see cref="IAiClient"/> and tidies up the answer.
/// </summary>
public class AiService : IAiService
{
    private const int MinResumeTextLength = 100;
    private const int MaxJobsSentForMatching = 20;
    private const int MinRecommendedMatch = 30;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(30);
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ApplicationDbContext _db;
    private readonly IAiClient _ai;
    private readonly IResumeStorage _resumes;
    private readonly ICandidateJobService _jobs;
    private readonly IMemoryCache _cache;
    private readonly AiOptions _options;

    public AiService(
        ApplicationDbContext db,
        IAiClient ai,
        IResumeStorage resumes,
        ICandidateJobService jobs,
        IMemoryCache cache,
        IOptions<AiOptions> options)
    {
        _db = db;
        _ai = ai;
        _resumes = resumes;
        _jobs = jobs;
        _cache = cache;
        _options = options.Value;
    }

    // ---------- Feature 1: resume analyzer ----------

    public async Task<ResumeAnalysisDto> AnalyzeResumeAsync(int userId, IFormFile? file, CancellationToken cancellationToken)
    {
        EnsureConfigured();
        var candidate = await _db.Candidates.Include(c => c.User).SingleOrDefaultAsync(c => c.UserId == userId, cancellationToken)
            ?? throw AppException.NotFound("Candidate profile not found.");

        var (pdf, fileName) = file is not null
            ? await ReadUploadedPdfAsync(file)
            : await ReadSavedPdfAsync(candidate);

        var text = PersonalInfoRedactor.CleanWhitespace(PdfTextExtractor.Extract(pdf));
        if (text.Length < MinResumeTextLength)
        {
            throw new AppException(
                "We couldn't find enough text in this PDF. Scanned or image-only resumes can't be analyzed; please use a text-based PDF.");
        }

        text = PersonalInfoRedactor.Redact(text, candidate.User.Name);
        if (text.Length > _options.MaxResumeCharacters)
        {
            text = text[.._options.MaxResumeCharacters];
        }

        var result = Tidy(await _ai.AnalyzeResumeAsync(text, cancellationToken));

        var analysis = new ResumeAnalysis
        {
            CandidateId = candidate.Id,
            ResumeFileName = fileName,
            Summary = result.Summary,
            TotalExperienceYears = result.TotalExperienceYears,
            ExtractedSkills = ToJson(result.Skills),
            Technologies = ToJson(result.Technologies),
            Experience = ToJson(result.Experience),
            Education = ToJson(result.Education),
            Projects = ToJson(result.Projects),
            AIResult = ToJson(result),
            Model = _options.Model
        };

        _db.ResumeAnalyses.Add(analysis);
        await _db.SaveChangesAsync(CancellationToken.None);

        return ToDto(analysis);
    }

    public async Task<ResumeAnalysisDto> GetLatestAnalysisAsync(int userId)
    {
        var candidateId = await _db.GetCandidateIdAsync(userId);
        var analysis = await LatestAnalysisQuery(candidateId).FirstOrDefaultAsync()
            ?? throw AppException.NotFound("You have not analyzed a resume yet.");

        return ToDto(analysis);
    }

    // ---------- Feature 2: skill match for one job ----------

    public async Task<SkillMatchDto> MatchSkillsAsync(int userId, int jobId, CancellationToken cancellationToken)
    {
        EnsureConfigured();
        var profile = await BuildCandidateProfileAsync(userId);

        var job = await _db.Jobs
            .Where(j => j.Id == jobId && j.Status == JobStatus.Approved)
            .Select(j => new { j.Id, j.Title, j.Skills, j.ExperienceRequired, j.Requirements, j.Description, Version = j.ReviewedAt ?? j.CreatedAt })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw AppException.NotFound("Job not found or no longer open.");

        var cacheKey = $"ai:skill-match:{profile.CandidateId}:{profile.Fingerprint}:{job.Id}:{job.Version.Ticks}";
        if (!_cache.TryGetValue(cacheKey, out AiSkillMatch? match) || match is null)
        {
            var jobForAi = new JobForMatching(
                job.Id,
                job.Title,
                SkillList.Parse(job.Skills),
                job.ExperienceRequired,
                Shorten(job.Requirements, 1500),
                Shorten(job.Description, 1000));

            match = await _ai.MatchSkillsAsync(profile.Skills, jobForAi, cancellationToken);
            _cache.Set(cacheKey, match, CacheDuration);
        }

        return new SkillMatchDto
        {
            JobId = job.Id,
            MatchPercentage = ClampPercent(match.MatchPercentage),
            MatchedSkills = CleanList(match.MatchedSkills, 20),
            MissingSkills = CleanList(match.MissingSkills, 20),
            Summary = Shorten(match.Summary, 500),
            UsedResumeAnalysis = profile.UsedResumeAnalysis
        };
    }

    // ---------- Feature 3: recommended jobs ----------

    public async Task<List<JobMatchDto>> GetJobMatchesAsync(int userId, int count, CancellationToken cancellationToken)
    {
        EnsureConfigured();
        count = Math.Clamp(count, 1, 10);
        var profile = await BuildCandidateProfileAsync(userId);

        var openJobs = await _db.Jobs
            .Where(j => j.Status == JobStatus.Approved && !j.Applications.Any(a => a.CandidateId == profile.CandidateId))
            .OrderByDescending(j => j.ReviewedAt ?? j.CreatedAt)
            .Take(200)
            .Select(j => new { j.Id, j.Title, j.Skills, j.ExperienceRequired, j.Requirements })
            .ToListAsync(cancellationToken);

        if (openJobs.Count == 0)
        {
            return [];
        }

        // Only the most promising jobs go to the AI, which keeps the request small.
        // A simple keyword overlap picks them; the AI then judges real relevance.
        var mySkills = profile.Skills.Skills.Select(s => s.ToLowerInvariant()).ToList();
        var shortlist = openJobs
            .Select((job, index) => new
            {
                Job = job,
                Index = index,
                Overlap = mySkills.Count(skill =>
                    $"{job.Title} {job.Skills} {job.Requirements}".Contains(skill, StringComparison.OrdinalIgnoreCase))
            })
            .OrderByDescending(x => x.Overlap)
            .ThenBy(x => x.Index)
            .Take(MaxJobsSentForMatching)
            .Select(x => new JobForMatching(
                x.Job.Id,
                x.Job.Title,
                SkillList.Parse(x.Job.Skills),
                x.Job.ExperienceRequired,
                Shorten(x.Job.Requirements, 300),
                null))
            .ToList();

        var jobIds = shortlist.Select(j => j.Id).Order().ToList();
        var cacheKey = $"ai:job-matches:{profile.CandidateId}:{profile.Fingerprint}:{string.Join(',', jobIds)}";
        if (!_cache.TryGetValue(cacheKey, out List<AiJobMatch>? matches) || matches is null)
        {
            matches = await _ai.MatchJobsAsync(profile.Skills, shortlist, cancellationToken);
            _cache.Set(cacheKey, matches, CacheDuration);
        }

        // Ignore any job id the AI made up, and keep the best score per job.
        var sentIds = jobIds.ToHashSet();
        var best = matches
            .Where(m => sentIds.Contains(m.JobId))
            .GroupBy(m => m.JobId)
            .Select(g => g.MaxBy(m => m.MatchPercentage)!)
            .Where(m => ClampPercent(m.MatchPercentage) >= MinRecommendedMatch)
            .OrderByDescending(m => m.MatchPercentage)
            .Take(count)
            .ToList();

        var listings = (await _jobs.GetListingsAsync(profile.CandidateId, best.Select(m => m.JobId).ToList()))
            .ToDictionary(j => j.Id);

        return best
            .Where(m => listings.ContainsKey(m.JobId))
            .Select(m => new JobMatchDto
            {
                Job = listings[m.JobId],
                MatchPercentage = ClampPercent(m.MatchPercentage),
                MatchedSkills = CleanList(m.MatchedSkills, 6),
                Reason = Shorten(m.Reason, 300)
            })
            .ToList();
    }

    // ---------- Helpers ----------

    private void EnsureConfigured()
    {
        if (!_options.IsConfigured)
        {
            throw AiClient.NotConfigured();
        }
    }

    private record CandidateContext(int CandidateId, CandidateSkillProfile Skills, bool UsedResumeAnalysis, string Fingerprint);

    /// <summary>
    /// Skills from the profile plus the latest resume analysis. Only skills, years and a short
    /// background go to the AI; no name, email, phone or location.
    /// </summary>
    private async Task<CandidateContext> BuildCandidateProfileAsync(int userId)
    {
        var candidate = await _db.Candidates
            .Where(c => c.UserId == userId)
            .Select(c => new { c.Id, c.Skills, c.ExperienceYears, c.Experience, c.User.Name })
            .SingleOrDefaultAsync()
            ?? throw AppException.NotFound("Candidate profile not found.");

        var analysis = await LatestAnalysisQuery(candidate.Id).FirstOrDefaultAsync();

        var skills = SkillList.Parse(candidate.Skills)
            .Concat(FromJson<List<string>>(analysis?.Technologies) ?? [])
            .Concat(FromJson<List<string>>(analysis?.ExtractedSkills) ?? [])
            .Select(s => s.Trim())
            .Where(s => s.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(60)
            .ToList();

        if (skills.Count == 0)
        {
            throw new AppException("Add skills to your profile or analyze your resume first, so we know what to match.");
        }

        decimal years = candidate.ExperienceYears > 0
            ? candidate.ExperienceYears
            : analysis?.TotalExperienceYears ?? 0;

        var background = analysis?.Summary
            ?? (string.IsNullOrWhiteSpace(candidate.Experience)
                ? null
                : Shorten(PersonalInfoRedactor.Redact(candidate.Experience, candidate.Name), 800));

        // Changes whenever the inputs change, so cached AI answers are never stale.
        var fingerprint = $"{string.Join('|', skills).ToLowerInvariant()}#{years}#{analysis?.Id}#{background?.GetHashCode()}";

        return new CandidateContext(
            candidate.Id,
            new CandidateSkillProfile(skills, years, background),
            analysis is not null,
            fingerprint);
    }

    private IQueryable<ResumeAnalysis> LatestAnalysisQuery(int candidateId) =>
        _db.ResumeAnalyses
            .Where(r => r.CandidateId == candidateId)
            .OrderByDescending(r => r.CreatedAt)
            .ThenByDescending(r => r.Id);

    private static async Task<(byte[] Pdf, string FileName)> ReadUploadedPdfAsync(IFormFile file)
    {
        await ResumeStorage.ValidateAsync(file, [".pdf"], "Only PDF files can be analyzed.");

        using var buffer = new MemoryStream();
        await file.CopyToAsync(buffer);
        return (buffer.ToArray(), Path.GetFileName(file.FileName));
    }

    private async Task<(byte[] Pdf, string FileName)> ReadSavedPdfAsync(Candidate candidate)
    {
        if (string.IsNullOrEmpty(candidate.ResumeStoredName))
        {
            throw new AppException("Upload a PDF resume first, or attach a PDF to analyze.");
        }

        if (!candidate.ResumeStoredName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            throw new AppException("AI analysis works with PDF resumes only. Upload your resume as a PDF to analyze it.");
        }

        var resume = CandidateService.OpenResume(_resumes, candidate);
        await using var content = resume.Content;
        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer);
        return (buffer.ToArray(), resume.FileName);
    }

    /// <summary>Trims, removes duplicates and caps sizes so the result fits the database columns.</summary>
    private static AiResumeAnalysis Tidy(AiResumeAnalysis ai) => new()
    {
        Summary = Shorten(ai.Summary, 2000),
        TotalExperienceYears = ai.TotalExperienceYears is { } years ? Math.Round(Math.Clamp(years, 0, 60), 1) : null,
        Skills = CleanList(ai.Skills, 40),
        Technologies = CleanList(ai.Technologies, 40),
        Experience = (ai.Experience ?? []).Where(e => !string.IsNullOrWhiteSpace(e.Role)).Take(15).Select(e => new AiExperience
        {
            Role = Shorten(e.Role, 150),
            Organization = ShortenOrNull(e.Organization, 150),
            Duration = ShortenOrNull(e.Duration, 60),
            Highlights = CleanList(e.Highlights, 4, 300)
        }).ToList(),
        Education = (ai.Education ?? []).Where(e => !string.IsNullOrWhiteSpace(e.Degree)).Take(10).Select(e => new AiEducation
        {
            Degree = Shorten(e.Degree, 200),
            Institution = ShortenOrNull(e.Institution, 200),
            Year = ShortenOrNull(e.Year, 30)
        }).ToList(),
        Projects = (ai.Projects ?? []).Where(p => !string.IsNullOrWhiteSpace(p.Name)).Take(10).Select(p => new AiProject
        {
            Name = Shorten(p.Name, 150),
            Description = Shorten(p.Description, 500),
            Technologies = CleanList(p.Technologies, 12)
        }).ToList()
    };

    private static ResumeAnalysisDto ToDto(ResumeAnalysis analysis) => new()
    {
        Id = analysis.Id,
        ResumeFileName = analysis.ResumeFileName,
        Summary = analysis.Summary ?? string.Empty,
        TotalExperienceYears = analysis.TotalExperienceYears,
        Skills = FromJson<List<string>>(analysis.ExtractedSkills) ?? [],
        Technologies = FromJson<List<string>>(analysis.Technologies) ?? [],
        Experience = FromJson<List<AiExperience>>(analysis.Experience) ?? [],
        Education = FromJson<List<AiEducation>>(analysis.Education) ?? [],
        Projects = FromJson<List<AiProject>>(analysis.Projects) ?? [],
        CreatedAt = analysis.CreatedAt
    };

    private static List<string> CleanList(IEnumerable<string>? items, int maxItems, int maxLength = 100) =>
        (items ?? [])
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => Shorten(s, maxLength))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(maxItems)
            .ToList();

    private static int ClampPercent(int value) => Math.Clamp(value, 0, 100);

    private static string Shorten(string? value, int maxLength)
    {
        var text = value?.Trim() ?? string.Empty;
        return text.Length <= maxLength ? text : text[..(maxLength - 1)].TrimEnd() + "…";
    }

    private static string? ShortenOrNull(string? value, int maxLength) =>
        string.IsNullOrWhiteSpace(value) ? null : Shorten(value, maxLength);

    private static string ToJson<T>(T value) => JsonSerializer.Serialize(value, JsonOptions);

    private static T? FromJson<T>(string? json) =>
        string.IsNullOrEmpty(json) ? default : JsonSerializer.Deserialize<T>(json, JsonOptions);
}
