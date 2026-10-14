"""Fill a local SkillHire AI API with realistic demo data through the public API.

Creates one recruiter (Northwind Labs) with three jobs, three candidates who apply,
one shortlisted candidate with an interview and one rejected candidate.
Every account uses the password Password123.

Usage (API running locally, development admin seeded):
    python3 scripts/demo_data.py [http://localhost:5052]
"""

import datetime
import json
import sys
import time
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5052"
RUN = int(time.time())
PASSWORD = "Password123"
ADMIN = {"email": "admin@skillhire.ai", "password": "Admin@12345"}


def call(method, path, body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read() or b"null")
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{method} {path} -> {e.code} {e.read()[:300]!r}")


def register(role, email, name, company=None):
    body = {"name": name, "email": email, "password": PASSWORD, "confirmPassword": PASSWORD, "role": role}
    if company:
        body["companyName"] = company
    return call("POST", "/api/auth/register", body)


recruiter = register("Recruiter", f"priya.{RUN}@northwind.example", "Priya Sharma", "Northwind Labs")
rt = recruiter["token"]
call("PUT", "/api/employer/profile", {
    "companyName": "Northwind Labs",
    "companyDescription": "Product studio building hiring and HR software for growing teams.",
    "location": "Bengaluru, India",
    "website": "https://northwind.example.com",
}, rt)

admin = call("POST", "/api/auth/login", ADMIN)["token"]

jobs = [
    ("Senior .NET Backend Engineer", "C#, ASP.NET Core, SQL Server, Azure", 4, 1800000, 2600000, "Bengaluru, India"),
    ("Frontend Engineer (React)", "React, TypeScript, Tailwind CSS, Testing", 2, 1200000, 1800000, "Remote"),
    ("Data Analyst", "SQL, Python, Power BI", 1, 800000, 1100000, "Pune, India"),
]
job_ids = []
for title, skills, years, low, high, location in jobs:
    job = call("POST", "/api/employer/jobs", {
        "title": title,
        "description": f"We are hiring a {title} to join our product team and ship features "
                       "used by thousands of recruiters every day.",
        "requirements": f"{years}+ years of hands-on experience with {skills}.",
        "skills": skills,
        "location": location,
        "salaryMin": low,
        "salaryMax": high,
        "experienceRequired": years,
    }, rt)
    job_ids.append(job["id"])

# The third job stays Pending so the admin has something to review.
call("PATCH", f"/api/admin/jobs/{job_ids[0]}/approve", None, admin)
call("PATCH", f"/api/admin/jobs/{job_ids[1]}/approve", None, admin)

candidates = [
    ("Arjun Mehta", "C#, ASP.NET Core, SQL Server, Docker", 5, job_ids[0]),
    ("Neha Kapoor", "React, TypeScript, CSS", 3, job_ids[1]),
    ("Rahul Verma", "C#, SQL Server", 2, job_ids[0]),
]
applications = []
for i, (name, skills, years, job_id) in enumerate(candidates):
    first = name.split()[0].lower()
    account = register("Candidate", f"{first}.{RUN}@mail.example", name)
    token = account["token"]
    call("PUT", "/api/candidate/profile", {
        "phone": f"+91 98765 4321{i}",
        "location": "Bengaluru, India",
        "skills": skills,
        "experienceYears": years,
        "experience": f"{years} years building web applications.",
        "resumeUrl": f"https://example.com/resumes/{first}.pdf",
    }, token)
    application = call("POST", "/api/candidate/applications", {
        "jobId": job_id,
        "coverLetter": "I would love to bring my experience to Northwind Labs.",
    }, token)
    applications.append((application["id"], account))

interview_at = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2)).replace(microsecond=0)
call("PATCH", f"/api/employer/applications/{applications[0][0]}/shortlist", None, rt)
call("POST", f"/api/employer/applications/{applications[0][0]}/interviews", {
    "interviewDate": interview_at.isoformat(),
    "type": "Online",
    "meetingLink": "https://meet.example.com/northwind-arjun",
    "notes": "45 minute technical round.",
}, rt)
call("PATCH", f"/api/employer/applications/{applications[2][0]}/reject", None, rt)

print("Demo data created. Password for every account:", PASSWORD)
print("  Recruiter:", recruiter["user"]["email"])
for _, account in applications:
    print("  Candidate:", account["user"]["email"])
