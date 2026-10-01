"""
End-to-end smoke test for the SkillHire AI API.

Calls every auth, employer and admin endpoint (the same requests Swagger sends)
and checks both the happy paths and the authorization / validation rules.

Usage (API must be running in Development):
    python3 scripts/api_smoke_test.py [base_url]
"""

import json
import sys
import time
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5052"
RUN = str(int(time.time()))
PASSWORD = "Password123"

passed = 0
failed = 0


def call(method, path, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as res:
            raw = res.read()
            return res.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as err:
        raw = err.read()
        try:
            return err.code, json.loads(raw) if raw else None
        except json.JSONDecodeError:
            return err.code, raw.decode()


def check(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        print(f"  FAIL  {name}  {detail}")


def expect(name, method, path, status, token=None, body=None):
    code, data = call(method, path, token, body)
    check(f"{name} -> {status}", code == status, f"(got {code}: {str(data)[:200]})")
    return data


def register(role, email, company=None):
    body = {
        "name": f"Test {role}",
        "email": email,
        "password": PASSWORD,
        "confirmPassword": PASSWORD,
        "role": role,
    }
    if company:
        body["companyName"] = company
    data = expect(f"register {role}", "POST", "/api/auth/register", 201, body=body)
    return data["token"]


VALID_JOB = {
    "title": "Senior React Developer",
    "description": "Build and maintain the SkillHire AI web app with a small product team.",
    "requirements": "React, TypeScript, REST APIs, Tailwind CSS",
    "location": "Remote",
    "salaryMin": 800000,
    "salaryMax": 1500000,
    "experienceRequired": 3,
}

print(f"\nSkillHire AI API smoke test against {BASE}\n")

print("Swagger")
spec = expect("swagger.json", "GET", "/swagger/v1/swagger.json", 200)
paths = spec.get("paths", {}) if isinstance(spec, dict) else {}
for p in ["/api/employer/profile", "/api/employer/jobs", "/api/employer/jobs/{id}/close",
          "/api/admin/users", "/api/admin/jobs/{id}/approve", "/api/admin/jobs/{id}/reject"]:
    check(f"swagger documents {p}", p in paths)

print("\nAccounts")
emp_a = register("Employer", f"emp-a-{RUN}@example.com", "Acme Corp")
emp_b = register("Employer", f"emp-b-{RUN}@example.com", "Other Inc")
cand = register("Candidate", f"cand-{RUN}@example.com")
admin = expect("admin login", "POST", "/api/auth/login", 200,
               body={"email": "admin@skillhire.ai", "password": "Admin@12345"})["token"]

print("\nEmployer profile")
profile = expect("GET profile", "GET", "/api/employer/profile", 200, emp_a)
check("profile starts incomplete", profile and profile["isComplete"] is False)
bad = expect("PUT profile with bad URL", "PUT", "/api/employer/profile", 400, emp_a,
             {"companyName": "Acme Corp", "website": "not-a-url"})
check("bad URL error is on Website", bad and "Website" in bad.get("errors", {}))
expect("PUT profile missing name", "PUT", "/api/employer/profile", 400, emp_a, {"companyName": ""})
profile = expect("PUT profile valid", "PUT", "/api/employer/profile", 200, emp_a, {
    "companyName": "Acme Corporation",
    "companyDescription": "We build hiring tools.",
    "location": "Pune, India",
    "website": "https://acme.example.com",
    "logoUrl": "https://acme.example.com/logo.png",
})
check("profile now complete", profile and profile["isComplete"] is True)
check("logoUrl saved", profile and profile["logoUrl"] == "https://acme.example.com/logo.png")

print("\nEmployer jobs")
bad = expect("create job invalid", "POST", "/api/employer/jobs", 400, emp_a,
             {**VALID_JOB, "title": "X", "salaryMin": 900, "salaryMax": 100, "experienceRequired": 99})
errors = (bad or {}).get("errors", {})
check("invalid job reports Title, SalaryMax, ExperienceRequired",
      all(k in errors for k in ["Title", "SalaryMax", "ExperienceRequired"]), str(errors))

job = expect("create job", "POST", "/api/employer/jobs", 201, emp_a, VALID_JOB)
job_id = job["id"]
check("new job is Pending", job["status"] == "Pending")
check("new job has company name", job["companyName"] == "Acme Corporation")

sneaky = expect("create job trying status=Approved", "POST", "/api/employer/jobs", 201, emp_a,
                {**VALID_JOB, "title": "Sneaky Job", "status": "Approved"})
check("employer cannot self-approve on create", sneaky["status"] == "Pending")

jobs = expect("GET my jobs", "GET", "/api/employer/jobs", 200, emp_a)
check("my jobs lists both jobs", len(jobs) == 2)
pending = expect("GET my jobs ?status=Pending", "GET", "/api/employer/jobs?status=Pending", 200, emp_a)
check("status filter works", len(pending) == 2)
expect("GET my job by id", "GET", f"/api/employer/jobs/{job_id}", 200, emp_a)
dash = expect("GET employer dashboard", "GET", "/api/employer/dashboard", 200, emp_a)
check("dashboard counts 2 pending", dash["jobs"]["pending"] == 2 and dash["jobs"]["total"] == 2)

print("\nOwnership and role checks")
expect("other employer GET my job", "GET", f"/api/employer/jobs/{job_id}", 404, emp_b)
expect("other employer PUT my job", "PUT", f"/api/employer/jobs/{job_id}", 404, emp_b, VALID_JOB)
expect("other employer close my job", "PATCH", f"/api/employer/jobs/{job_id}/close", 404, emp_b)
check("other employer sees no jobs", call("GET", "/api/employer/jobs", emp_b)[1] == [])
expect("employer approve own job via admin API", "PATCH", f"/api/admin/jobs/{job_id}/approve", 403, emp_a)
expect("employer GET admin users", "GET", "/api/admin/users", 403, emp_a)
expect("candidate GET employer jobs", "GET", "/api/employer/jobs", 403, cand)
expect("candidate POST employer job", "POST", "/api/employer/jobs", 403, cand, VALID_JOB)
expect("candidate GET employer profile", "GET", "/api/employer/profile", 403, cand)
expect("candidate GET admin users", "GET", "/api/admin/users", 403, cand)
expect("candidate approve job", "PATCH", f"/api/admin/jobs/{job_id}/approve", 403, cand)
expect("admin GET employer jobs", "GET", "/api/employer/jobs", 403, admin)
expect("no token employer jobs", "GET", "/api/employer/jobs", 401)
expect("no token admin jobs", "GET", "/api/admin/jobs", 401)

print("\nAdmin views")
dash = expect("GET admin dashboard", "GET", "/api/admin/dashboard", 200, admin)
check("admin dashboard has pending jobs", dash["jobs"]["pending"] >= 2 and len(dash["recentPendingJobs"]) >= 1)
users = expect("GET users", "GET", "/api/admin/users", 200, admin)
check("users include new accounts", any(u["email"] == f"cand-{RUN}@example.com" for u in users))
emps = expect("GET users ?role=Employer", "GET", "/api/admin/users?role=Employer", 200, admin)
check("role filter only returns employers", emps and all(u["role"] == "Employer" for u in emps))
found = expect("GET users ?search=", "GET", f"/api/admin/users?search=emp-a-{RUN}", 200, admin)
check("search finds one user", len(found) == 1)
employers = expect("GET employers", "GET", "/api/admin/employers", 200, admin)
acme = next((e for e in employers if e["email"] == f"emp-a-{RUN}@example.com"), None)
check("employer row has company and job count", acme and acme["companyName"] == "Acme Corporation" and acme["jobCount"] == 2)
candidates = expect("GET candidates", "GET", "/api/admin/candidates", 200, admin)
check("candidate listed", any(c["email"] == f"cand-{RUN}@example.com" for c in candidates))
all_jobs = expect("GET all jobs", "GET", "/api/admin/jobs", 200, admin)
check("all jobs include new job", any(j["id"] == job_id for j in all_jobs))
q = expect("GET jobs ?status=Pending", "GET", "/api/admin/jobs?status=Pending", 200, admin)
check("pending filter only pending", q and all(j["status"] == "Pending" for j in q))
q = expect("GET jobs/pending", "GET", "/api/admin/jobs/pending", 200, admin)
check("pending shortcut includes job", any(j["id"] == job_id for j in q))
expect("GET job by id", "GET", f"/api/admin/jobs/{job_id}", 200, admin)
expect("GET missing job", "GET", "/api/admin/jobs/99999999", 404, admin)

print("\nApproval workflow")
approved = expect("approve job", "PATCH", f"/api/admin/jobs/{job_id}/approve", 200, admin)
check("job is Approved", approved["status"] == "Approved" and approved["reviewedAt"])
expect("approve again", "PATCH", f"/api/admin/jobs/{job_id}/approve", 409, admin)
expect("reject approved job", "PATCH", f"/api/admin/jobs/{job_id}/reject", 409, admin, {"reason": "Too late now"})

edited = expect("employer edits approved job", "PUT", f"/api/employer/jobs/{job_id}", 200, emp_a,
                {**VALID_JOB, "title": "Lead React Developer"})
check("edit sends approved job back to Pending", edited["status"] == "Pending" and edited["title"] == "Lead React Developer")

expect("reject without reason", "PATCH", f"/api/admin/jobs/{job_id}/reject", 400, admin, {"reason": ""})
rejected = expect("reject with reason", "PATCH", f"/api/admin/jobs/{job_id}/reject", 200, admin,
                  {"reason": "Please add more detail about the team."})
check("job is Rejected with reason", rejected["status"] == "Rejected" and rejected["rejectionReason"])

edited = expect("employer edits rejected job", "PUT", f"/api/employer/jobs/{job_id}", 200, emp_a, VALID_JOB)
check("resubmitted job is Pending and reason cleared", edited["status"] == "Pending" and edited["rejectionReason"] is None)

closed = expect("employer closes job", "PATCH", f"/api/employer/jobs/{job_id}/close", 200, emp_a)
check("job is Closed", closed["status"] == "Closed")
expect("close again", "PATCH", f"/api/employer/jobs/{job_id}/close", 409, emp_a)
expect("edit closed job", "PUT", f"/api/employer/jobs/{job_id}", 409, emp_a, VALID_JOB)
expect("admin approve closed job", "PATCH", f"/api/admin/jobs/{job_id}/approve", 409, admin)

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
