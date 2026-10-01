"""
End-to-end test of the candidate / application / interview workflow.

Covers profile + resume upload, job search filters, applying, the employer
review flow (shortlist, interview, select, reject) and every ownership and
role rule.

Usage (API must be running in Development):
    python3 scripts/application_workflow_test.py [base_url]
"""

import json
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5052"
RUN = str(int(time.time()))
PASSWORD = "Password123"
ADMIN = {"email": "admin@skillhire.ai", "password": "Admin@12345"}

# Smallest file that still starts with a real PDF signature.
PDF_BYTES = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"

passed = 0
failed = 0


def send(req):
    try:
        with urllib.request.urlopen(req) as res:
            raw = res.read()
            ctype = res.headers.get("Content-Type", "")
            return res.status, (json.loads(raw) if raw and "json" in ctype else raw), res.headers
    except urllib.error.HTTPError as err:
        raw = err.read()
        try:
            return err.code, json.loads(raw) if raw else None, err.headers
        except json.JSONDecodeError:
            return err.code, raw.decode(errors="replace"), err.headers


def call(method, path, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    code, payload, _ = send(req)
    return code, payload


def upload(path, token, filename, content, content_type="application/octet-stream"):
    boundary = uuid.uuid4().hex
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="File"; filename="{filename}"\r\n'
        f"Content-Type: {content_type}\r\n\r\n"
    ).encode() + content + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(BASE + path, data=body, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    req.add_header("Authorization", f"Bearer {token}")
    code, payload, _ = send(req)
    return code, payload


def download(path, token):
    req = urllib.request.Request(BASE + path, method="GET")
    req.add_header("Authorization", f"Bearer {token}")
    return send(req)


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
    check(f"{name} -> {status}", code == status, f"(got {code}: {str(data)[:300]})")
    return data


def register(role, email, name, company=None):
    body = {"name": name, "email": email, "password": PASSWORD, "confirmPassword": PASSWORD, "role": role}
    if company:
        body["companyName"] = company
    return expect(f"register {role} {name}", "POST", "/api/auth/register", 201, body=body)["token"]


def future(days=3, hours=0):
    return (datetime.now(timezone(timedelta(hours=5, minutes=30))) + timedelta(days=days, hours=hours)).isoformat()


def job(title, skills, location, experience):
    return {
        "title": f"{title} {RUN}",
        "description": f"Join our team as a {title}. You will work on real products with real users.",
        "requirements": f"Solid experience with {skills}.",
        "skills": skills,
        "location": location,
        "salaryMin": 600000,
        "salaryMax": 1200000,
        "experienceRequired": experience,
    }


def ids(page):
    return [j["id"] for j in page["items"]]


print(f"\nSkillHire AI application workflow test against {BASE}\n")

print("Swagger")
_, spec = call("GET", "/swagger/v1/swagger.json")
paths = spec.get("paths", {}) if isinstance(spec, dict) else {}
for p in ["/api/candidate/profile", "/api/candidate/resume", "/api/candidate/dashboard",
          "/api/candidate/jobs", "/api/candidate/jobs/{id}", "/api/candidate/applications",
          "/api/candidate/applications/{id}", "/api/candidate/interviews",
          "/api/employer/applications", "/api/employer/applications/{id}",
          "/api/employer/applications/{id}/resume", "/api/employer/applications/{id}/shortlist",
          "/api/employer/applications/{id}/reject", "/api/employer/applications/{id}/select",
          "/api/employer/applications/{id}/interviews", "/api/employer/interviews/{id}"]:
    check(f"swagger documents {p}", p in paths)

print("\nSetup: users and jobs")
emp_a = register("Employer", f"emp.a.{RUN}@example.com", "Employer A", "Initech")
emp_b = register("Employer", f"emp.b.{RUN}@example.com", "Employer B", "Umbrella")
cand1 = register("Candidate", f"cand1.{RUN}@example.com", "Riya Verma")
cand2 = register("Candidate", f"cand2.{RUN}@example.com", "Arjun Mehta")
admin = expect("admin login", "POST", "/api/auth/login", 200, body=ADMIN)["token"]

backend = expect("post backend job", "POST", "/api/employer/jobs", 201, emp_a, job("Backend Developer", "C#, ASP.NET Core, SQL", "Pune", 2))
frontend = expect("post frontend job", "POST", "/api/employer/jobs", 201, emp_a, job("Frontend Engineer", "React, TypeScript", "Remote", 5))
pending = expect("post pending job", "POST", "/api/employer/jobs", 201, emp_a, job("Pending Role", "Go", "Delhi", 0))
closed = expect("post job to close", "POST", "/api/employer/jobs", 201, emp_a, job("Closed Role", "Java", "Chennai", 0))
check("job skills are normalized", backend["skills"] == "C#, ASP.NET Core, SQL", backend.get("skills"))
for j in (backend, frontend, closed):
    expect(f"admin approves {j['id']}", "PATCH", f"/api/admin/jobs/{j['id']}/approve", 200, admin)
expect("employer closes job", "PATCH", f"/api/employer/jobs/{closed['id']}/close", 200, emp_a)

print("\nCandidate profile")
profile = expect("get empty profile", "GET", "/api/candidate/profile", 200, cand1)
check("new profile is incomplete", profile["isComplete"] is False and profile["hasResume"] is False)
bad = expect("invalid profile", "PUT", "/api/candidate/profile", 400, cand1,
             {"experienceYears": 60, "resumeUrl": "not-a-url", "phone": "abc"})
errors = (bad or {}).get("errors", {})
check("profile errors cover experience, resume link and phone",
      all(k in errors for k in ["ExperienceYears", "ResumeUrl", "Phone"]), errors)
profile = expect("update profile", "PUT", "/api/candidate/profile", 200, cand1, {
    "phone": "+91 98765 43210", "location": "Pune, India", "skills": "C#, SQL, c#, React ",
    "experienceYears": 3, "experience": "3 years building .NET APIs at a fintech startup.",
})
check("skills parsed and de-duplicated", profile["skills"] == ["C#", "SQL", "React"], profile["skills"])
check("profile without resume is still incomplete", profile["isComplete"] is False)

print("\nResume upload")
code, data = upload("/api/candidate/resume", cand1, "resume.txt", b"hello")
check("txt file rejected -> 400", code == 400, f"(got {code}: {data})")
code, data = upload("/api/candidate/resume", cand1, "resume.pdf", b"MZ fake executable")
check("fake pdf rejected -> 400", code == 400, f"(got {code}: {data})")
code, data = upload("/api/candidate/resume", cand1, "resume.pdf", b"%PDF" + b"0" * (5 * 1024 * 1024 + 10))
check("file over 5 MB rejected -> 400/413", code in (400, 413), f"(got {code}: {str(data)[:200]})")
code, profile = upload("/api/candidate/resume", cand1, "Riya_Verma_CV.pdf", PDF_BYTES, "application/pdf")
check("valid pdf uploaded -> 200", code == 200, f"(got {code}: {profile})")
check("profile now complete with resume", profile.get("isComplete") and profile.get("resumeFileName") == "Riya_Verma_CV.pdf", profile)
code, body, headers = download("/api/candidate/resume", cand1)
check("download own resume -> 200 pdf", code == 200 and body == PDF_BYTES and headers.get("Content-Type") == "application/pdf",
      f"(got {code} {headers.get('Content-Type')})")

print("\nBrowse and search jobs")
page = expect("search by run id", "GET", f"/api/candidate/jobs?search={RUN}", 200, cand1)
check("only approved, open jobs listed", sorted(ids(page)) == sorted([backend["id"], frontend["id"]]), ids(page))
page = expect("filter by location", "GET", f"/api/candidate/jobs?search={RUN}&location=pune", 200, cand1)
check("location filter", ids(page) == [backend["id"]], ids(page))
page = expect("filter by experience", "GET", f"/api/candidate/jobs?search={RUN}&experience=3", 200, cand1)
check("experience filter hides 5-year job", ids(page) == [backend["id"]], ids(page))
page = expect("filter by skills (all must match)", "GET", f"/api/candidate/jobs?search={RUN}&skills=C%23,SQL", 200, cand1)
check("skills filter C#+SQL", ids(page) == [backend["id"]], ids(page))
page = expect("filter by skills no match", "GET", f"/api/candidate/jobs?search={RUN}&skills=React,SQL", 200, cand1)
check("skills filter React+SQL matches nothing", ids(page) == [], ids(page))
page = expect("paging", "GET", f"/api/candidate/jobs?search={RUN}&pageSize=1&page=2", 200, cand1)
check("page 2 of size 1", len(page["items"]) == 1 and page["totalCount"] == 2 and page["totalPages"] == 2, page)
details = expect("job details", "GET", f"/api/candidate/jobs/{backend['id']}", 200, cand1)
check("details include company and no application yet",
      details["companyName"] == "Initech" and details["applicationId"] is None and "C#" in details["skills"], details)
expect("pending job hidden", "GET", f"/api/candidate/jobs/{pending['id']}", 404, cand1)
expect("closed job hidden", "GET", f"/api/candidate/jobs/{closed['id']}", 404, cand1)

print("\nApplying")
expect("apply without resume", "POST", "/api/candidate/applications", 400, cand2, {"jobId": backend["id"]})
expect("apply to pending job", "POST", "/api/candidate/applications", 404, cand1, {"jobId": pending["id"]})
expect("apply to closed job", "POST", "/api/candidate/applications", 409, cand1, {"jobId": closed["id"]})
expect("apply to missing job", "POST", "/api/candidate/applications", 404, cand1, {"jobId": 99999999})
expect("cover letter too long", "POST", "/api/candidate/applications", 400, cand1, {"jobId": backend["id"], "coverLetter": "x" * 3001})
app1 = expect("apply", "POST", "/api/candidate/applications", 201, cand1,
              {"jobId": backend["id"], "coverLetter": "I have built .NET APIs for 3 years."})
check("new application is Applied", app1["status"] == "Applied" and app1["jobTitle"] == backend["title"], app1)
expect("apply twice", "POST", "/api/candidate/applications", 409, cand1, {"jobId": backend["id"]})
details = expect("job details after applying", "GET", f"/api/candidate/jobs/{backend['id']}", 200, cand1)
check("details show my application", details["applicationId"] == app1["id"] and details["applicationStatus"] == "Applied")
mine = expect("my applications", "GET", "/api/candidate/applications", 200, cand1)
check("list contains application", [a["id"] for a in mine] == [app1["id"]])
updated = expect("edit cover letter", "PUT", f"/api/candidate/applications/{app1['id']}", 200, cand1,
                 {"coverLetter": "Updated: 3 years of C# and SQL Server."})
check("cover letter saved", updated["coverLetter"].startswith("Updated"))

print("\nOwnership and roles")
expect("other candidate reads it", "GET", f"/api/candidate/applications/{app1['id']}", 404, cand2)
expect("other candidate edits it", "PUT", f"/api/candidate/applications/{app1['id']}", 404, cand2, {"coverLetter": "hack"})
expect("other candidate withdraws it", "DELETE", f"/api/candidate/applications/{app1['id']}", 404, cand2)
expect("other employer reads it", "GET", f"/api/employer/applications/{app1['id']}", 404, emp_b)
expect("other employer shortlists it", "PATCH", f"/api/employer/applications/{app1['id']}/shortlist", 404, emp_b)
code, _, _ = download(f"/api/employer/applications/{app1['id']}/resume", emp_b)
check("other employer resume -> 404", code == 404, f"(got {code})")
check("other employer sees no applications",
      expect("other employer list", "GET", "/api/employer/applications", 200, emp_b) == [])
expect("candidate on employer API", "GET", "/api/employer/applications", 403, cand1)
expect("employer on candidate API", "GET", "/api/candidate/jobs", 403, emp_a)
expect("employer applies", "POST", "/api/candidate/applications", 403, emp_a, {"jobId": backend["id"]})
expect("admin on candidate API", "GET", "/api/candidate/profile", 403, admin)
expect("admin on employer applications", "GET", "/api/employer/applications", 403, admin)
expect("anonymous", "GET", "/api/candidate/applications", 401)

print("\nEmployer review")
listed = expect("employer lists applications", "GET", "/api/employer/applications", 200, emp_a)
check("list shows candidate", len(listed) == 1 and listed[0]["candidateName"] == "Riya Verma" and listed[0]["hasResume"], listed)
check("filter by job", len(expect("filter by job", "GET", f"/api/employer/applications?jobId={frontend['id']}", 200, emp_a)) == 0)
check("search by skill", len(expect("search by skill", "GET", "/api/employer/applications?search=SQL", 200, emp_a)) == 1)
check("filter by status", len(expect("filter by status", "GET", "/api/employer/applications?status=Shortlisted", 200, emp_a)) == 0)
full = expect("application details", "GET", f"/api/employer/applications/{app1['id']}", 200, emp_a)
check("details include profile, cover letter and resume",
      full["candidatePhone"] == "+91 98765 43210" and full["coverLetter"].startswith("Updated")
      and full["resumeFileName"] == "Riya_Verma_CV.pdf" and full["candidateExperienceYears"] == 3, full)
code, body, _ = download(f"/api/employer/applications/{app1['id']}/resume", emp_a)
check("employer downloads resume -> 200", code == 200 and body == PDF_BYTES, f"(got {code})")
jobs = expect("my jobs", "GET", "/api/employer/jobs", 200, emp_a)
check("job shows application count", next(j for j in jobs if j["id"] == backend["id"])["applicationCount"] == 1)

expect("select straight from Applied", "PATCH", f"/api/employer/applications/{app1['id']}/select", 409, emp_a)
shortlisted = expect("shortlist", "PATCH", f"/api/employer/applications/{app1['id']}/shortlist", 200, emp_a)
check("status Shortlisted", shortlisted["status"] == "Shortlisted")
expect("shortlist twice", "PATCH", f"/api/employer/applications/{app1['id']}/shortlist", 409, emp_a)
expect("candidate edits after review", "PUT", f"/api/candidate/applications/{app1['id']}", 409, cand1, {"coverLetter": "late"})
expect("candidate withdraws after review", "DELETE", f"/api/candidate/applications/{app1['id']}", 409, cand1)

print("\nInterviews")
past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
expect("interview in the past", "POST", f"/api/employer/applications/{app1['id']}/interviews", 400, emp_a,
       {"interviewDate": past, "type": "InPerson"})
expect("online without link", "POST", f"/api/employer/applications/{app1['id']}/interviews", 400, emp_a,
       {"interviewDate": future(), "type": "Online"})
expect("other employer schedules", "POST", f"/api/employer/applications/{app1['id']}/interviews", 404, emp_b,
       {"interviewDate": future(), "type": "Phone"})
interview = expect("schedule interview", "POST", f"/api/employer/applications/{app1['id']}/interviews", 201, emp_a, {
    "interviewDate": future(2), "type": "Online", "meetingLink": "https://meet.example.com/abc-123",
    "notes": "45 minute technical round with the backend lead.",
})
check("interview Scheduled", interview["status"] == "Scheduled" and interview["candidateName"] == "Riya Verma", interview)
expect("second interview while one is scheduled", "POST", f"/api/employer/applications/{app1['id']}/interviews", 409, emp_a,
       {"interviewDate": future(4), "type": "Phone"})
mine = expect("candidate application", "GET", f"/api/candidate/applications/{app1['id']}", 200, cand1)
check("application moved to InterviewScheduled", mine["status"] == "InterviewScheduled" and len(mine["interviews"]) == 1)
upcoming = expect("candidate upcoming interviews", "GET", "/api/candidate/interviews?upcoming=true", 200, cand1)
check("candidate sees interview details",
      len(upcoming) == 1 and upcoming[0]["meetingLink"] == "https://meet.example.com/abc-123"
      and upcoming[0]["companyName"] == "Initech", upcoming)
check("other candidate sees no interviews", expect("other candidate interviews", "GET", "/api/candidate/interviews", 200, cand2) == [])
expect("bad interview status", "PATCH", f"/api/employer/interviews/{interview['id']}", 400, emp_a, {"status": "Scheduled"})
expect("other employer updates interview", "PATCH", f"/api/employer/interviews/{interview['id']}", 404, emp_b, {"status": "Completed"})
done = expect("complete interview", "PATCH", f"/api/employer/interviews/{interview['id']}", 200, emp_a,
              {"status": "Completed", "feedback": "Strong on APIs and SQL."})
check("interview Completed with feedback", done["status"] == "Completed" and done["feedback"] == "Strong on APIs and SQL.")
expect("complete twice", "PATCH", f"/api/employer/interviews/{interview['id']}", 409, emp_a, {"status": "Cancelled"})
seen = expect("candidate interviews", "GET", "/api/candidate/interviews", 200, cand1)
check("candidate sees feedback after completion", seen[0]["feedback"] == "Strong on APIs and SQL.")

selected = expect("select", "PATCH", f"/api/employer/applications/{app1['id']}/select", 200, emp_a)
check("status Selected", selected["status"] == "Selected")
expect("reject after selected", "PATCH", f"/api/employer/applications/{app1['id']}/reject", 409, emp_a)
expect("interview after selected", "POST", f"/api/employer/applications/{app1['id']}/interviews", 409, emp_a,
       {"interviewDate": future(), "type": "Phone"})

print("\nWithdraw, cancel and reject flows")
expect("candidate 2 adds resume link", "PUT", "/api/candidate/profile", 200, cand2,
       {"location": "Remote", "skills": "React, TypeScript", "experienceYears": 6,
        "resumeUrl": "https://drive.example.com/arjun-cv"})
app2 = expect("candidate 2 applies", "POST", "/api/candidate/applications", 201, cand2, {"jobId": frontend["id"]})
expect("candidate 2 withdraws", "DELETE", f"/api/candidate/applications/{app2['id']}", 204, cand2)
expect("withdrawn application gone", "GET", f"/api/candidate/applications/{app2['id']}", 404, cand2)
app2 = expect("candidate 2 re-applies", "POST", "/api/candidate/applications", 201, cand2, {"jobId": frontend["id"]})
code, _, _ = download(f"/api/employer/applications/{app2['id']}/resume", emp_a)
check("no uploaded file (link only) -> 404", code == 404, f"(got {code})")
expect("shortlist candidate 2", "PATCH", f"/api/employer/applications/{app2['id']}/shortlist", 200, emp_a)
iv2 = expect("schedule phone interview", "POST", f"/api/employer/applications/{app2['id']}/interviews", 201, emp_a,
             {"interviewDate": future(1), "type": "Phone", "notes": "We will call you on your registered number."})
check("candidate cannot see feedback before completion",
      expect("candidate 2 interviews", "GET", "/api/candidate/interviews", 200, cand2)[0]["feedback"] is None)
expect("cancel interview", "PATCH", f"/api/employer/interviews/{iv2['id']}", 200, emp_a, {"status": "Cancelled", "feedback": "Clash"})
back = expect("application after cancel", "GET", f"/api/employer/applications/{app2['id']}", 200, emp_a)
check("cancelling the only interview returns to Shortlisted", back["status"] == "Shortlisted", back["status"])
iv3 = expect("reschedule", "POST", f"/api/employer/applications/{app2['id']}/interviews", 201, emp_a,
             {"interviewDate": future(5), "type": "InPerson", "notes": "Initech office, 4th floor."})
rejected = expect("reject candidate 2", "PATCH", f"/api/employer/applications/{app2['id']}/reject", 200, emp_a)
check("status Rejected and interview cancelled",
      rejected["status"] == "Rejected" and all(i["status"] == "Cancelled" for i in rejected["interviews"]), rejected)

print("\nDashboards")
dash = expect("candidate dashboard", "GET", "/api/candidate/dashboard", 200, cand1)
check("candidate stats", dash["applications"]["total"] == 1 and dash["applications"]["selected"] == 1, dash["applications"])
check("latest jobs exclude applied ones", all(j["id"] != backend["id"] for j in dash["latestJobs"]))
dash = expect("employer dashboard", "GET", "/api/employer/dashboard", 200, emp_a)
check("employer application stats",
      dash["applications"]["total"] == 2 and dash["applications"]["selected"] == 1 and dash["applications"]["rejected"] == 1,
      dash["applications"])

print("\nResume delete")
profile = expect("delete resume", "DELETE", "/api/candidate/resume", 200, cand1)
check("resume removed", profile["hasResume"] is False and profile["resumeFileName"] is None)
expect("delete again", "DELETE", "/api/candidate/resume", 404, cand1)
code, _, _ = download("/api/candidate/resume", cand1)
check("download after delete -> 404", code == 404, f"(got {code})")

print(f"\n{passed} passed, {failed} failed\n")
sys.exit(1 if failed else 0)
