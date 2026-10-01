# SkillHire AI

A role-based job recruitment platform. Employers post jobs, candidates search and apply,
and admins run the platform. AI (Google Gemini) helps candidates with resume analysis,
skill-match percentages and job recommendations.

**Current status: Day 5 — forgot password (email code) and dark/light theme.**

- Day 1: foundation and authentication.
- Day 2: employer company profile, employer job posting (create, edit, close),
  admin review of jobs (approve / reject), admin views of users, employers and candidates.
- Day 3: candidate profile and resume upload, job search with filters, applying to jobs,
  tracking applications, employer review (shortlist, reject, select) and interview scheduling.
- Day 4: AI resume analyzer (PDF → structured skills, experience, education, projects),
  AI skill match on job details, and AI job recommendations on the candidate dashboard.
- Day 5: forgot password for employers and candidates (6-digit email code), and a
  dark/light theme toggle that is remembered across visits.

## Tech stack

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Frontend       | React 19, TypeScript, Vite, React Router, Axios, Tailwind CSS |
| Backend        | ASP.NET Core Web API (.NET 10), C#                      |
| ORM / Database | Entity Framework Core 10, Microsoft SQL Server 2022     |
| Auth           | JWT bearer tokens, BCrypt password hashing              |
| Authorization  | Roles: `Admin`, `Employer`, `Candidate`                 |
| API docs       | Swagger UI                                              |
| AI             | Google Gemini (OpenAI-compatible Chat Completions) with structured outputs, PdfPig for PDF text |

## Project structure

```
SkillHireAI/
├── backend/
│   └── SkillHireAI.API/
│       ├── Controllers/     Auth, Dashboard, Employer, EmployerJobs, EmployerApplications,
│       │                    Admin, Candidate, CandidateJobs, CandidateApplications, Ai
│       ├── Models/          User, Employer, Candidate, Job, Application, Interview, ResumeAnalysis,
│       │                    PasswordResetToken
│       ├── DTOs/            Request/response objects (entities are never returned directly)
│       ├── Data/            ApplicationDbContext, DbSeeder (creates the first admin)
│       ├── Services/        Auth, Token, PasswordReset, Employer, Admin, Candidate,
│       │                    application and interview services, resume storage
│       │   ├── Email/       IEmailSender: SMTP, or the console in Development
│       │   └── AI/          IAiClient (the only code that calls the AI provider), prompts and
│       │                    JSON schemas, PDF text extraction, personal-info redaction
│       ├── App_Data/        Uploaded resumes (created at runtime, not in git)
│       ├── Middleware/      Global exception handling
│       ├── Migrations/      EF Core migrations
│       ├── Program.cs
│       └── appsettings.json
├── frontend/
│   └── skillhire-client/
│       └── src/
│           ├── components/  App layout, buttons, tables, modals, form fields, jobs/
│           ├── pages/       Login, Register, ForgotPassword, ResetPassword, admin/,
│           │                employer/, candidate/
│           ├── services/    Axios client, auth / employer / admin APIs, token and theme storage
│           ├── hooks/       useApi (loading + error state for API calls)
│           ├── context/     AuthContext + useAuth, ThemeContext + useTheme
│           ├── routes/      Protected and role-based routes
│           └── types/       TypeScript models
├── scripts/
│   ├── api_smoke_test.py               Day 1-2 API checks
│   ├── application_workflow_test.py    Day 3 candidate, application and interview checks
│   ├── ai_features_test.py             Day 4 AI endpoint checks (uses the mock below)
│   ├── password_reset_test.py          Day 5 forgot-password checks
│   └── mock_openai.py                  Local stand-in for the AI API, no key or cost
├── docker-compose.yml       Local SQL Server
└── README.md
```

## Prerequisites

- .NET SDK 10
- Node.js 20+
- Docker Desktop (for SQL Server). On Apple Silicon, turn on
  **Settings → General → "Use Rosetta for x86_64/amd64 emulation"**.

## Running locally

### 1. Start SQL Server

```bash
docker compose up -d
```

Wait ~20 seconds the first time while SQL Server starts.

### 2. Run the API

```bash
cd backend
dotnet tool restore                      # installs dotnet-ef (local tool)
cd SkillHireAI.API
dotnet ef database update                # creates SkillHireAI_DB and all tables
dotnet run --launch-profile http
```

- API: http://localhost:5052
- Swagger: http://localhost:5052/swagger

In Development the API also applies pending migrations and seeds the admin on startup,
so `dotnet ef database update` is optional after the first run.

### 3. Run the React app

```bash
cd frontend/skillhire-client
npm install
npm run dev
```

Open http://localhost:5173.

The sun/moon button (top right on the login pages, in the header once logged in) switches
between light and dark mode. The choice is saved in `localStorage`; on a first visit the
app follows the operating system's setting.

## Default admin (development only)

Admins cannot self-register. One is seeded from `appsettings.Development.json`:

- Email: `admin@skillhire.ai`
- Password: `Admin@12345`

## API endpoints

### Auth (Day 1)

| Method | Endpoint                   | Access      |
| ------ | -------------------------- | ----------- |
| POST   | `/api/auth/register`       | Public      |
| POST   | `/api/auth/login`          | Public      |
| GET    | `/api/auth/me`             | Any logged-in user |
| POST   | `/api/auth/forgot-password` | Public (Day 5) |
| POST   | `/api/auth/verify-otp`     | Public (Day 5) |
| POST   | `/api/auth/reset-password` | Public (Day 5) |
| GET    | `/api/dashboard/admin`     | Admin       |
| GET    | `/api/dashboard/employer`  | Employer    |
| GET    | `/api/dashboard/candidate` | Candidate   |

How forgot password works (Day 5):

1. `forgot-password` `{ "email" }` emails a 6-digit code. It always answers with the same
   message, so it can't be used to find out which emails are registered. Admin accounts
   never get a code.
2. `verify-otp` `{ "email", "otp" }` checks the code before the "new password" form is shown.
3. `reset-password` `{ "email", "otp", "newPassword", "confirmPassword" }` sets the new
   password (same rules as registration, hashed with BCrypt) and uses up the code.

Codes are stored only as a hash in `PasswordResetTokens`, expire after 10 minutes, work
once, stop working after 5 wrong tries or when a newer code is sent, and are never
returned by the API. A new code can be requested once a minute, and each endpoint
allows 10 requests per minute per IP address. Settings are in the `PasswordReset`
section of `appsettings.json`. Existing logins (JWTs) are not affected.

### Employer (Day 2, Employer role only)

| Method | Endpoint                          | Description |
| ------ | --------------------------------- | ----------- |
| GET    | `/api/employer/dashboard`         | Job counts and recent jobs |
| GET    | `/api/employer/profile`           | Company profile |
| PUT    | `/api/employer/profile`           | Update company profile |
| GET    | `/api/employer/jobs?status=`      | My jobs (optional status filter) |
| GET    | `/api/employer/jobs/{id}`         | One of my jobs |
| POST   | `/api/employer/jobs`              | Create a job (always starts as `Pending`) |
| PUT    | `/api/employer/jobs/{id}`         | Edit a job (approved/rejected jobs go back to `Pending`) |
| PATCH  | `/api/employer/jobs/{id}/close`   | Close a job |

### Admin (Day 2, Admin role only)

| Method | Endpoint                          | Description |
| ------ | --------------------------------- | ----------- |
| GET    | `/api/admin/dashboard`            | User and job counts, oldest pending jobs |
| GET    | `/api/admin/users?role=&search=`  | All users |
| GET    | `/api/admin/employers?search=`    | Employers with job counts |
| GET    | `/api/admin/candidates?search=`   | Candidates |
| GET    | `/api/admin/jobs?status=&search=` | All jobs |
| GET    | `/api/admin/jobs/pending`         | Jobs waiting for review |
| GET    | `/api/admin/jobs/{id}`            | Job details |
| PATCH  | `/api/admin/jobs/{id}/approve`    | Approve a pending job |
| PATCH  | `/api/admin/jobs/{id}/reject`     | Reject a pending job, body: `{ "reason": "..." }` |

Job status rules: employers never set status themselves, only `Pending` jobs can be
approved or rejected, and closed jobs cannot be edited or reopened.

### Candidate (Day 3, Candidate role only)

| Method | Endpoint                                   | Description |
| ------ | ------------------------------------------ | ----------- |
| GET    | `/api/candidate/dashboard`                 | Application counts, upcoming interviews, new jobs |
| GET    | `/api/candidate/profile`                   | My profile |
| PUT    | `/api/candidate/profile`                   | Update phone, location, skills, experience, resume link |
| POST   | `/api/candidate/resume`                    | Upload resume (multipart `file`; PDF, DOC or DOCX, max 5 MB) |
| GET    | `/api/candidate/resume`                    | Download my resume |
| DELETE | `/api/candidate/resume`                    | Remove my resume |
| GET    | `/api/candidate/interviews?upcoming=`      | My interviews |
| GET    | `/api/candidate/jobs?search=&location=&experience=&skills=&page=&pageSize=` | Search approved jobs |
| GET    | `/api/candidate/jobs/{id}`                 | Approved job details |
| GET    | `/api/candidate/applications?status=`      | My applications |
| GET    | `/api/candidate/applications/{id}`         | One of my applications, with interviews |
| POST   | `/api/candidate/applications`              | Apply, body: `{ "jobId": 1, "coverLetter": "..." }` |
| PUT    | `/api/candidate/applications/{id}`         | Edit cover letter (only while `Applied`) |
| DELETE | `/api/candidate/applications/{id}`         | Withdraw (only while `Applied`) |

### Employer applications and interviews (Day 3, Employer role only)

| Method | Endpoint                                         | Description |
| ------ | ------------------------------------------------ | ----------- |
| GET    | `/api/employer/applications?jobId=&status=&search=` | Applications for my jobs |
| GET    | `/api/employer/applications/{id}`                | Application with candidate profile and interviews |
| GET    | `/api/employer/applications/{id}/resume`         | Download the candidate's resume |
| PATCH  | `/api/employer/applications/{id}/shortlist`      | Shortlist |
| PATCH  | `/api/employer/applications/{id}/reject`         | Reject (cancels scheduled interviews) |
| PATCH  | `/api/employer/applications/{id}/select`         | Select |
| POST   | `/api/employer/applications/{id}/interviews`     | Schedule an interview |
| GET    | `/api/employer/interviews?upcoming=`             | My interviews |
| PATCH  | `/api/employer/interviews/{id}`                  | Mark `Completed` (with feedback) or `Cancelled` |

Application rules: a candidate applies only to `Approved` jobs, only once per job, and
needs a resume (uploaded file or link). Statuses move
`Applied → Shortlisted → InterviewScheduled → Selected`, and `Rejected` is possible until
the candidate is selected. Anything owned by another user returns `404`.

### AI (Day 4, Candidate role only)

| Method | Endpoint                         | Description |
| ------ | -------------------------------- | ----------- |
| POST   | `/api/ai/analyze-resume`         | Analyze a PDF (multipart `file`, max 5 MB) or, with no file, the saved PDF resume. Saved to `ResumeAnalyses` |
| GET    | `/api/ai/resume-analysis`        | My latest analysis |
| POST   | `/api/ai/skill-match`            | Body `{ "jobId": 18 }` → `matchPercentage`, `matchedSkills`, `missingSkills`, `summary` |
| GET    | `/api/ai/job-matches?count=5`    | Approved jobs I haven't applied to, ranked by AI relevance |

How the AI is used:

- Gemini is only called from the backend (`Services/AI/AiClient.cs`); the React app
  never sees the key.
- Responses use structured outputs (a strict JSON schema), so they map straight to C# classes.
- Emails, phone numbers, links and the candidate's name are removed from resume text before
  it is sent. Matching sends only skills, years of experience and a short background.
- Skill match and job matches are guidance only. Nothing is stored on applications and no
  candidate is ever selected or rejected automatically.
- Results are cached for 30 minutes (until the profile, resume analysis or job changes), and
  each user can make 10 AI requests per minute (`AI:RequestsPerMinute`).
- AI failures become friendly errors: `503` when AI is not set up, busy or unreachable,
  `502` for an unexpected answer, `422` if the AI refuses the content.

To call protected endpoints in Swagger, log in, copy the `token`, click **Authorize**
and paste it.

### API tests

With the API running, these register test users and check every endpoint,
including role and ownership rules:

```bash
python3 scripts/api_smoke_test.py            # auth, employer and admin
python3 scripts/application_workflow_test.py # candidates, applications, interviews
```

The AI test runs against a local mock AI server, so it needs no key and costs nothing:

```bash
python3 scripts/mock_openai.py               # terminal 1
cd backend/SkillHireAI.API                   # terminal 2
AI__ApiKey=test-key AI__BaseUrl=http://localhost:5099/v1/ dotnet run --launch-profile http
python3 scripts/ai_features_test.py          # terminal 3
```

The forgot-password test reads the reset codes from the API's console output, so save it
to a file (takes about a minute because it waits out the resend cooldown):

```bash
cd backend/SkillHireAI.API
dotnet run --launch-profile http > /tmp/skillhire_api.log 2>&1   # terminal 1
python3 scripts/password_reset_test.py                          # terminal 2
```

## Configuration and secrets

`appsettings.json` holds no secrets. The values in `appsettings.Development.json`
(SQL password, JWT key, admin password) are for local development only. For any
shared or production environment, set them through environment variables, e.g.

```bash
export ConnectionStrings__DefaultConnection="Server=...;Database=SkillHireAI_DB;..."
export Jwt__Key="a-long-random-secret-of-at-least-32-bytes"
```

### Email (password reset codes)

With no SMTP server configured, the API prints emails (including reset codes) to its
console in Development, so you can test locally. Outside Development nothing is printed
and the email is not sent. To send real email, fill in the `Email` section of
`appsettings.json` (`SmtpHost`, `SmtpPort`, `Username`, `FromAddress`) and keep the
password in user secrets:

```bash
cd backend/SkillHireAI.API
dotnet user-secrets set "Email:SmtpHost" "smtp.gmail.com"
dotnet user-secrets set "Email:Username" "you@gmail.com"
dotnet user-secrets set "Email:Password" "your-app-password"
```

### AI (Gemini) API key

The AI features use Google Gemini through its OpenAI-compatible API. The key is never
stored in the repo and never goes into the React app (`.env` files are bundled into the
browser). For local development use user secrets:

```bash
cd backend/SkillHireAI.API
dotnet user-secrets set "AI:ApiKey" "your-gemini-key"
```

Or set an environment variable: `AI__ApiKey` (or `GEMINI_API_KEY`).
Without a key the app still works; AI features show "AI features are not set up".
Other settings (`AI:Model`, default `gemini-3.8-flash`, `AI:BaseUrl`, timeout, rate limit)
are in `appsettings.json`. Any OpenAI-compatible provider works by changing `BaseUrl`,
`Model` and the key.

On Gemini's free tier the quota is small (about 20 requests for this model per quota
window). When it runs out, AI features answer "The AI service is busy right now".
Temporary "high demand" errors from Gemini are retried twice automatically.

## Useful commands

```bash
# Add a new migration after changing models
cd backend/SkillHireAI.API
dotnet ef migrations add <Name>
dotnet ef database update

# Stop SQL Server (data is kept in a Docker volume)
docker compose down
```
