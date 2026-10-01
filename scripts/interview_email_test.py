"""
End-to-end test of interview email notifications.

Without SMTP settings the API writes emails to its console in Development, so start it
with its output saved to a file, and this script reads the emails from there:

    cd backend/SkillHireAI.API
    dotnet run --launch-profile http > /tmp/skillhire_api.log 2>&1

Then:
    python3 scripts/interview_email_test.py [base_url] [api_log_path]
"""

import json
import re
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5052"
LOG = sys.argv[2] if len(sys.argv) > 2 else "/tmp/skillhire_api.log"
RUN = str(int(time.time()))
PASSWORD = "Password123"
ADMIN = {"email": "admin@skillhire.ai", "password": "Admin@12345"}
IST = timezone(timedelta(hours=5, minutes=30))
PDF_BYTES = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"

passed = 0
failed = 0


def send(req):
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            raw = res.read()
            return res.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as err:
        raw = err.read()
        try:
            return err.code, json.loads(raw) if raw else None
        except json.JSONDecodeError:
            return err.code, raw.decode(errors="replace")


def call(method, path, token=None, body=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    return send(req)


def upload_resume(token):
    boundary = uuid.uuid4().hex
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="File"; filename="cv.pdf"\r\n'
        "Content-Type: application/pdf\r\n\r\n"
    ).encode() + PDF_BYTES + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(BASE + "/api/candidate/resume", data=body, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
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


def emails_to(address):
    """Every development email sent to this address so far: (subject, body), oldest first."""
    with open(LOG, encoding="utf-8", errors="replace") as f:
        text = f.read()
    found = []
    for block in text.split("DEVELOPMENT EMAIL (no SMTP configured)")[1:]:
        lines = [line.strip() for line in block.splitlines()]
        to = next((line[3:].strip() for line in lines if line.startswith("To:")), None)
        if to != address:
            continue
        subject = next((line[8:].strip() for line in lines if line.startswith("Subject:")), "")
        start = next(i for i, line in enumerate(lines) if line.startswith("Subject:")) + 1
        body = []
        for line in lines[start:]:
            if re.match(r"^(info|warn|fail|dbug|crit):", line):
                break
            body.append(line)
        found.append((subject, "\n".join(body)))
    return found


def wait_for_emails(address, count):
    for _ in range(20):
        mails = emails_to(address)
        if len(mails) >= count:
            return mails
        time.sleep(0.25)
    return emails_to(address)


def ist_text(dt):
    return dt.astimezone(IST).strftime("%A, %-d %B %Y at %-I:%M %p") + " (UTC+05:30)"


print(f"\nSkillHire AI interview email test against {BASE} (reading emails from {LOG})\n")

print("Setup: employer job, candidate application, shortlist")
admin = expect("admin login", "POST", "/api/auth/login", 200, body=ADMIN)["token"]
company = f"Mail Test Co {RUN}"
emp_email = f"mail.emp.{RUN}@example.com"
cand_email = f"mail.cand.{RUN}@example.com"
emp = register("Employer", emp_email, "Mail Employer", company)
other_emp = register("Employer", f"mail.other.{RUN}@example.com", "Other Employer", f"Other Co {RUN}")
cand = register("Candidate", cand_email, "Mail Candidate")
job_title = f"Interview Mail Developer {RUN}"
job = expect("post job", "POST", "/api/employer/jobs", 201, emp, {
    "title": job_title,
    "description": "Build and run real products with a small, friendly team.",
    "requirements": "Experience with C# and React.",
    "skills": "C#, React",
    "location": "Hyderabad",
    "salaryMin": 600000,
    "salaryMax": 1200000,
    "experienceRequired": 1,
})
expect("admin approves job", "PATCH", f"/api/admin/jobs/{job['id']}/approve", 200, admin)
code, _ = upload_resume(cand)
check("upload resume -> 200", code == 200, f"(got {code})")
app = expect("candidate applies", "POST", "/api/candidate/applications", 201, cand, {"jobId": job["id"]})
expect("employer shortlists", "PATCH", f"/api/employer/applications/{app['id']}/shortlist", 200, emp)
check("no email yet", emails_to(cand_email) == [])

print("\nScheduling an interview emails the candidate")
when = (datetime.now(IST) + timedelta(days=3)).replace(hour=10, minute=30, second=0, microsecond=0)
link = "https://meet.example.com/skillhire-" + RUN
interview = expect("schedule online interview", "POST", f"/api/employer/applications/{app['id']}/interviews", 201, emp, {
    "interviewDate": when.isoformat(),
    "type": "Online",
    "meetingLink": link,
    "notes": "Please keep your camera on.\nThe call takes about 45 minutes.",
})
check("  response says candidate was notified", interview.get("candidateNotified") is True, str(interview))
mails = wait_for_emails(cand_email, 1)
check("  exactly one email to the candidate", len(mails) == 1, f"(got {len(mails)})")
subject, body = mails[-1] if mails else ("", "")
check("  subject names job and company", subject == f"Interview scheduled: {job_title} at {company}", subject)
check("  greets the candidate", "Hi Mail Candidate," in body)
check("  date and time in IST", ist_text(when) in body, f"(expected {ist_text(when)!r} in {body!r})")
check("  interview type", "Online (video call)" in body)
check("  meeting link", link in body)
check("  employer notes, all lines", "Please keep your camera on." in body and "about 45 minutes" in body)
check("  link to the interviews page", "http://localhost:5173/candidate/interviews" in body)
check("  employer is not emailed", emails_to(emp_email) == [])

listed = expect("candidate sees the interview", "GET", "/api/candidate/interviews", 200, cand)
check("  list has no notification flag", listed and all("candidateNotified" not in i for i in listed))

expect("second interview while one is scheduled", "POST", f"/api/employer/applications/{app['id']}/interviews", 409, emp, {
    "interviewDate": when.isoformat(), "type": "Phone",
})
expect("other employer cannot schedule", "POST", f"/api/employer/applications/{app['id']}/interviews", 404, other_emp, {
    "interviewDate": when.isoformat(), "type": "Phone",
})
expect("invalid request (past date)", "POST", f"/api/employer/applications/{app['id']}/interviews", 400, emp, {
    "interviewDate": (datetime.now(IST) - timedelta(days=1)).isoformat(), "type": "Phone",
})
time.sleep(0.5)
check("  failed attempts send no email", len(emails_to(cand_email)) == 1)

print("\nCancelling emails the candidate")
cancelled = expect("employer cancels", "PATCH", f"/api/employer/interviews/{interview['id']}", 200, emp, {"status": "Cancelled"})
check("  response says candidate was notified", cancelled.get("candidateNotified") is True, str(cancelled))
mails = wait_for_emails(cand_email, 2)
check("  cancellation email sent", len(mails) == 2, f"(got {len(mails)})")
subject, body = mails[-1] if len(mails) >= 2 else ("", "")
check("  cancellation subject", subject == f"Interview cancelled: {job_title} at {company}", subject)
check("  mentions the original time", ist_text(when) in body)

print("\nIn-person interview, then completed")
later = when + timedelta(days=2, hours=4)
interview2 = expect("schedule in-person interview", "POST", f"/api/employer/applications/{app['id']}/interviews", 201, emp, {
    "interviewDate": later.isoformat(),
    "type": "InPerson",
    "notes": "Office: 4th floor, Cyber Towers, Hyderabad. Ask for Priya at reception.",
})
check("  candidate notified", interview2.get("candidateNotified") is True)
mails = wait_for_emails(cand_email, 3)
subject, body = mails[-1] if len(mails) >= 3 else ("", "")
check("  third email is the new invite", subject.startswith("Interview scheduled:"), subject)
check("  type in person", "Type:  In person" in body)
check("  no meeting link line", "Link:" not in body)
check("  office address from notes", "Cyber Towers" in body)
check("  new time", ist_text(later) in body, f"(expected {ist_text(later)!r})")

done = expect("employer marks completed", "PATCH", f"/api/employer/interviews/{interview2['id']}", 200, emp,
              {"status": "Completed", "feedback": "Great conversation."})
check("  no notification flag for completed", "candidateNotified" not in done)
time.sleep(0.5)
check("  no email for completed", len(emails_to(cand_email)) == 3)

print(f"\n{passed} passed, {failed} failed\n")
sys.exit(1 if failed else 0)
