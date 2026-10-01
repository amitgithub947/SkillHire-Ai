# SkillHire AI

A role-based job recruitment platform. Employers post jobs, candidates search and apply,
and admins run the platform. AI (OpenAI) will help candidates with resume analysis,
skill-match percentages and job recommendations.

**Current status: Day 2 — employer and admin job management.**

- Day 1: foundation and authentication.
- Day 2: employer company profile, employer job posting (create, edit, close),
  admin review of jobs (approve / reject), admin views of users, employers and candidates.

## Tech stack

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Frontend       | React 19, TypeScript, Vite, React Router, Axios, Tailwind CSS |
| Backend        | ASP.NET Core Web API (.NET 10), C#                      |
| ORM / Database | Entity Framework Core 10, Microsoft SQL Server 2022     |
| Auth           | JWT bearer tokens, BCrypt password hashing              |
| Authorization  | Roles: `Admin`, `Employer`, `Candidate`                 |
| API docs       | Swagger UI                                              |

## Project structure

```
SkillHireAI/
├── backend/
│   └── SkillHireAI.API/
│       ├── Controllers/     Auth, Dashboard, Employer, EmployerJobs, Admin
│       ├── Models/          User, Employer, Candidate, Job, Application, Interview, ResumeAnalysis
│       ├── DTOs/            Request/response objects (entities are never returned directly)
│       ├── Data/            ApplicationDbContext, DbSeeder (creates the first admin)
│       ├── Services/        Auth, Token, Employer, EmployerJob, Admin services
│       ├── Middleware/      Global exception handling
│       ├── Migrations/      EF Core migrations
│       ├── Program.cs
│       └── appsettings.json
├── frontend/
│   └── skillhire-client/
│       └── src/
│           ├── components/  App layout, buttons, tables, modals, form fields, jobs/
│           ├── pages/       Login, Register, admin/, employer/, candidate/
│           ├── services/    Axios client, auth / employer / admin APIs, token storage
│           ├── hooks/       useApi (loading + error state for API calls)
│           ├── context/     AuthContext + useAuth hook
│           ├── routes/      Protected and role-based routes
│           └── types/       TypeScript models
├── scripts/api_smoke_test.py  End-to-end API checks
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
| GET    | `/api/dashboard/admin`     | Admin       |
| GET    | `/api/dashboard/employer`  | Employer    |
| GET    | `/api/dashboard/candidate` | Candidate   |

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

To call protected endpoints in Swagger, log in, copy the `token`, click **Authorize**
and paste it.

### Smoke test

With the API running, this registers test users and checks every endpoint,
including role and ownership rules:

```bash
python3 scripts/api_smoke_test.py
```

## Configuration and secrets

`appsettings.json` holds no secrets. The values in `appsettings.Development.json`
(SQL password, JWT key, admin password) are for local development only. For any
shared or production environment, set them through environment variables, e.g.

```bash
export ConnectionStrings__DefaultConnection="Server=...;Database=SkillHireAI_DB;..."
export Jwt__Key="a-long-random-secret-of-at-least-32-bytes"
```

## Useful commands

```bash
# Add a new migration after changing models
cd backend/SkillHireAI.API
dotnet ef migrations add <Name>
dotnet ef database update

# Stop SQL Server (data is kept in a Docker volume)
docker compose down
```
