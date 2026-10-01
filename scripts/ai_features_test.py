"""
End-to-end test of the three AI features: resume analyzer, skill match and job matches.

Start the mock OpenAI server and point the API at it (no real key or cost needed):

    python3 scripts/mock_openai.py
    cd backend/SkillHireAI.API
    AI__ApiKey=test-key AI__BaseUrl=http://localhost:5099/v1/ dotnet run --launch-profile http

Then:
    python3 scripts/ai_features_test.py [base_url] [mock_url]
"""

import json
import sys
import time
import urllib.error
import urllib.request
import uuid

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5052"
MOCK = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:5099"
RUN = str(int(time.time()))
PASSWORD = "Password123"
ADMIN = {"email": "admin@skillhire.ai", "password": "Admin@12345"}

passed = 0
failed = 0


def make_pdf(lines):
    """A small but valid PDF (with xref table) containing the given lines of text."""
    def esc(s):
        return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    text = "".join(f"({esc(line)}) Tj 0 -16 Td " for line in lines)
    stream = f"BT /F1 11 Tf 50 780 Td {text}ET".encode() if lines else b""
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode() + obj + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    return bytes(out)


RESUME_LINES = [
    "Ananya Rao",
    "ananya.rao@example.com | +91 98765 43210 | linkedin.com/in/ananya-rao-dev",
    "Software Engineer, FinEdge Payments, 2022 - Present",
    "Built payment APIs with C#, ASP.NET Core and SQL Server.",
    "Improved React dashboard performance by 40 percent using code splitting.",
    "Junior Developer, BrightApps, 2021 - 2022",
    "Education: B.Tech Computer Science, JNTU Hyderabad, 2021",
    "Projects: Expense Tracker - React, ASP.NET Core, SQL Server",
    "Skills: C#, ASP.NET Core, React, TypeScript, SQL Server, Docker, Unit testing",
]


def send(req):
    try:
        with urllib.request.urlopen(req, timeout=90) as res:
            raw = res.read()
            ctype = res.headers.get("Content-Type", "")
            return res.status, (json.loads(raw) if raw and "json" in ctype else raw), res.headers
    except urllib.error.HTTPError as err:
        raw = err.read()
        try:
            return err.code, json.loads(raw) if raw else None, err.headers
        except json.JSONDecodeError:
            return err.code, raw.decode(errors="replace"), err.headers


def call(method, path, token=None, body=None, base=BASE):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    code, payload, _ = send(req)
    return code, payload


def multipart(path, token, filename=None, content=b"", content_type="application/pdf"):
    """POST multipart/form-data with an optional File part."""
    boundary = uuid.uuid4().hex
    body = b""
    if filename is not None:
        body += (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="File"; filename="{filename}"\r\n'
            f"Content-Type: {content_type}\r\n\r\n"
        ).encode() + content + b"\r\n"
    body += f"--{boundary}--\r\n".encode()
    req = urllib.request.Request(BASE + path, data=body, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    code, payload, _ = send(req)
    return code, payload


def check(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        print(f"  FAIL  {name}  {detail}")


def expect_code(name, result, status):
    code, data = result
    check(f"{name} -> {status}", code == status, f"(got {code}: {str(data)[:300]})")
    return data


def expect(name, method, path, status, token=None, body=None):
    return expect_code(name, call(method, path, token, body), status)


def register(role, email, name, company=None):
    body = {"name": name, "email": email, "password": PASSWORD, "confirmPassword": PASSWORD, "role": role}
    if company:
        body["companyName"] = company
    return expect(f"register {role} {name}", "POST", "/api/auth/register", 201, body=body)["token"]


def mock_mode(mode):
    call("POST", "/__mode", body={"mode": mode}, base=MOCK)


def mock_last():
    return call("GET", "/__last", base=MOCK)[1]


def detail(data):
    return data.get("detail", "") if isinstance(data, dict) else str(data)


print(f"\nSkillHire AI features test against {BASE} (mock OpenAI at {MOCK})\n")
mock_mode("ok")

print("Swagger")
_, spec = call("GET", "/swagger/v1/swagger.json")
paths = spec.get("paths", {}) if isinstance(spec, dict) else {}
for p in ["/api/ai/analyze-resume", "/api/ai/skill-match", "/api/ai/job-matches", "/api/ai/resume-analysis"]:
    check(f"swagger lists {p}", p in paths)
form = paths.get("/api/ai/analyze-resume", {}).get("post", {}).get("requestBody", {}).get("content", {})
check("analyze-resume takes multipart file", "multipart/form-data" in form)

print("\nSetup: employer with jobs, admin approval")
employer = register("Employer", f"ai.employer.{RUN}@example.com", "Ravi Menon", f"AI Test Labs {RUN}")
admin = expect("admin login", "POST", "/api/auth/login", 200, body=ADMIN)["token"]


def post_job(title, skills, experience, approve=True):
    created = expect(f"create job {title}", "POST", "/api/employer/jobs", 201, employer, {
        "title": f"{title} {RUN}",
        "description": f"Work on our {title.lower()} team shipping features to real customers.",
        "requirements": f"Hands-on experience with {skills}.",
        "skills": skills,
        "location": "Hyderabad",
        "salaryMin": 800000,
        "salaryMax": 1600000,
        "experienceRequired": experience,
    })
    if approve:
        expect(f"approve {title}", "PATCH", f"/api/admin/jobs/{created['id']}/approve", 200, admin)
    return created["id"]


job_fullstack = post_job("Senior .NET React Engineer", "C#, ASP.NET Core, React, TypeScript, Azure", 3)
job_data = post_job("Data Engineer", "Python, Spark, Airflow, Snowflake", 2)
job_mobile = post_job("Flutter Developer", "Flutter, Dart, Firebase, React", 1)
job_pending = post_job("Pending Role", "C#", 1, approve=False)

print("\nAccess rules")
expect_code("anonymous analyze", multipart("/api/ai/analyze-resume", None, "r.pdf", make_pdf(RESUME_LINES)), 401)
expect("anonymous skill-match", "POST", "/api/ai/skill-match", 401, body={"jobId": job_fullstack})
expect("anonymous job-matches", "GET", "/api/ai/job-matches", 401)
expect("employer job-matches", "GET", "/api/ai/job-matches", 403, employer)
expect("employer skill-match", "POST", "/api/ai/skill-match", 403, employer, {"jobId": job_fullstack})
expect("admin analyze", "GET", "/api/ai/resume-analysis", 403, admin)

print("\nResume analyzer: file validation")
validator = register("Candidate", f"ai.validator.{RUN}@example.com", "Vikram Shah")
expect("no analysis yet", "GET", "/api/ai/resume-analysis", 404, validator)
d = expect_code("no file and no saved resume", multipart("/api/ai/analyze-resume", validator), 400)
check("  says to upload a PDF", "PDF" in detail(d), detail(d))
d = expect_code("text file", multipart("/api/ai/analyze-resume", validator, "resume.txt", b"hello", "text/plain"), 400)
check("  says PDF only", "Only PDF" in detail(d), detail(d))
d = expect_code("docx file", multipart("/api/ai/analyze-resume", validator, "resume.docx", b"PK\x03\x04rest"), 400)
check("  docx rejected as not PDF", "Only PDF" in detail(d), detail(d))
d = expect_code("renamed exe as .pdf", multipart("/api/ai/analyze-resume", validator, "resume.pdf", b"MZ\x90\x00binary"), 400)
check("  content check", "does not look like" in detail(d), detail(d))
expect_code("empty pdf", multipart("/api/ai/analyze-resume", validator, "resume.pdf", b""), 400)
code, _ = multipart("/api/ai/analyze-resume", validator, "big.pdf", b"%PDF" + b"0" * (5 * 1024 * 1024 + 10))
check("over 5 MB -> 400/413", code in (400, 413), f"(got {code})")
d = expect_code("image-only pdf (no text)", multipart("/api/ai/analyze-resume", validator, "scan.pdf", make_pdf([])), 400)
check("  explains scanned PDFs", "text" in detail(d), detail(d))
d = expect_code("broken pdf", multipart("/api/ai/analyze-resume", validator, "broken.pdf", b"%PDF-1.4 garbage"), 400)
check("  explains unreadable PDF", "could not be read" in detail(d), detail(d))

print("\nResume analyzer: uploaded file")
ananya = register("Candidate", f"ai.ananya.{RUN}@example.com", "Ananya Rao")
calls_before = mock_last()["calls"]
analysis = expect_code("analyze attached PDF", multipart("/api/ai/analyze-resume", ananya, "Ananya_Rao.pdf", make_pdf(RESUME_LINES)), 200)
last = mock_last()
check("one OpenAI call", last["calls"] == calls_before + 1)
sent = last["last"]["messages"][1]["content"]
system = last["last"]["messages"][0]["content"]
check("resume text was sent", "FinEdge Payments" in sent and "ASP.NET Core" in sent)
check("email removed before sending", "ananya.rao@example.com" not in sent and "[email]" in sent)
check("phone removed before sending", "98765" not in sent and "[phone]" in sent)
check("linkedin removed before sending", "linkedin.com" not in sent and "[link]" in sent)
check("name removed before sending", "Ananya Rao" not in sent and "[name]" in sent)
check("date ranges kept", "2022 - Present" in sent and "2021 - 2022" in sent)
check("structured output requested", last["last"]["response_format"]["json_schema"]["name"] == "resume_analysis")
check("prompt guards against injected instructions", "untrusted" in system)
check("api key not in request body", "test-key" not in json.dumps(last["last"]))
if isinstance(analysis, dict):
    check("skills extracted", "Unit testing" in analysis.get("skills", []))
    check("technologies extracted", "ASP.NET Core" in analysis.get("technologies", []))
    check("experience extracted", analysis.get("experience", [{}])[0].get("organization") == "FinEdge Payments")
    check("education extracted", analysis.get("education", [{}])[0].get("degree", "").startswith("B.Tech"))
    check("projects extracted", analysis.get("projects", [{}])[0].get("name") == "Expense Tracker")
    check("experience years", analysis.get("totalExperienceYears") == 4)
    check("file name kept", analysis.get("resumeFileName") == "Ananya_Rao.pdf")
    check("created date is UTC", str(analysis.get("createdAt", "")).endswith("Z"))
    latest = expect("get latest analysis", "GET", "/api/ai/resume-analysis", 200, ananya)
    check("latest analysis is the saved one", latest.get("id") == analysis.get("id") and latest.get("projects") == analysis.get("projects"))
profile = expect("profile unchanged", "GET", "/api/candidate/profile", 200, ananya)
check("analyzing does not replace saved resume", profile.get("hasResume") is False)

print("\nResume analyzer: saved resume")
neha = register("Candidate", f"ai.saved.{RUN}@example.com", "Kiran Patel")
expect_code("upload docx resume", multipart("/api/candidate/resume", neha, "cv.docx", b"PK\x03\x04docx"), 200)
d = expect_code("analyze saved docx", multipart("/api/ai/analyze-resume", neha), 400)
check("  says PDF resumes only", "PDF resumes only" in detail(d), detail(d))
expect_code("upload pdf resume", multipart("/api/candidate/resume", neha, "Kiran_Patel.pdf", make_pdf(RESUME_LINES)), 200)
saved = expect_code("analyze saved pdf", multipart("/api/ai/analyze-resume", neha), 200)
check("saved resume name used", isinstance(saved, dict) and saved.get("resumeFileName") == "Kiran_Patel.pdf")

print("\nSkill match")
empty = register("Candidate", f"ai.empty.{RUN}@example.com", "Meera Iyer")
d = expect("no skills and no analysis", "POST", "/api/ai/skill-match", 400, empty, {"jobId": job_fullstack})
check("  asks for skills", "skills" in detail(d), detail(d))
expect("missing jobId", "POST", "/api/ai/skill-match", 400, ananya, {})
expect("unknown job", "POST", "/api/ai/skill-match", 404, ananya, {"jobId": 99999999})
expect("pending job", "POST", "/api/ai/skill-match", 404, ananya, {"jobId": job_pending})

match = expect("match full stack job", "POST", "/api/ai/skill-match", 200, ananya, {"jobId": job_fullstack})
if isinstance(match, dict):
    check("percentage 0-100", 0 <= match.get("matchPercentage", -1) <= 100)
    check("matched skills from resume analysis", {"C#", "ASP.NET Core", "React", "TypeScript"} <= set(match.get("matchedSkills", [])), match)
    check("missing skills", match.get("missingSkills") == ["Azure"], match)
    check("percentage", match.get("matchPercentage") == 80, match)
    check("summary present", len(match.get("summary", "")) > 0)
    check("used resume analysis", match.get("usedResumeAnalysis") is True)
sent = mock_last()["last"]["messages"][1]["content"]
check("no name or email sent for matching", "Ananya" not in sent and "@" not in sent)
calls_before = mock_last()["calls"]
again = expect("same match again", "POST", "/api/ai/skill-match", 200, ananya, {"jobId": job_fullstack})
check("cached (no second OpenAI call)", mock_last()["calls"] == calls_before and again == match)

expect("add profile skill", "PUT", "/api/candidate/profile", 200, ananya, {"skills": "Azure", "experienceYears": 4})
updated = expect("match after profile change", "POST", "/api/ai/skill-match", 200, ananya, {"jobId": job_fullstack})
check("new skill counted (cache refreshed)", isinstance(updated, dict) and updated.get("matchPercentage") == 100, updated)
check("application status untouched", expect("my applications", "GET", "/api/candidate/applications", 200, ananya) == [])

print("\nJob matches")
d = expect("no skills", "GET", "/api/ai/job-matches", 400, empty)
check("  asks for skills", "skills" in detail(d), detail(d))
expect("apply to mobile job", "POST", "/api/candidate/applications", 201, neha, {"jobId": job_mobile})
matches = expect("job matches", "GET", "/api/ai/job-matches?count=10", 200, neha)
if isinstance(matches, list):
    ids = [m["job"]["id"] for m in matches]
    percents = [m["matchPercentage"] for m in matches]
    check("returns recommendations", len(matches) > 0)
    check("best match first", percents == sorted(percents, reverse=True), percents)
    # Older test runs may leave stronger matches that fill every slot.
    check("full stack job recommended", job_fullstack in ids or (len(ids) == 10 and min(percents) >= 80), ids)
    check("unrelated data job left out", job_data not in ids, ids)
    check("applied job left out", job_mobile not in ids, ids)
    check("pending job left out", job_pending not in ids, ids)
    check("invented job id ignored", 999999 not in ids)
    check("all at least 30%", all(p >= 30 for p in percents), percents)
    first = matches[0] if matches else {}
    check("includes job details", bool(first.get("job", {}).get("title")) and bool(first.get("job", {}).get("companyName")))
    check("includes reason and matched skills", bool(first.get("reason")) and isinstance(first.get("matchedSkills"), list))
top = expect("count=1", "GET", "/api/ai/job-matches?count=1", 200, neha)
check("count limits results", isinstance(top, list) and len(top) <= 1)

print("\nOpenAI errors are handled")
errors = register("Candidate", f"ai.errors.{RUN}@example.com", "Arjun Nair")
expect("give skills", "PUT", "/api/candidate/profile", 200, errors, {"skills": "C#, React", "experienceYears": 2})
for mode, status, words in [
    ("429", 503, "busy"),
    ("401", 503, "unavailable"),
    ("500", 503, "trouble"),
    ("badjson", 502, "unexpected"),
    ("refusal", 422, "could not process"),
]:
    mock_mode(mode)
    d = expect(f"OpenAI {mode}", "POST", "/api/ai/skill-match", status, errors, {"jobId": job_data})
    check(f"  friendly message ({words})", words in detail(d).lower(), detail(d))
    check("  no key or raw error leaked", "test-key" not in json.dumps(d) and "Incorrect API key" not in json.dumps(d))
mock_mode("ok")
expect("works again after errors", "POST", "/api/ai/skill-match", 200, errors, {"jobId": job_data})

print("\nRate limit (10 AI requests per minute per user)")
limited = register("Candidate", f"ai.limit.{RUN}@example.com", "Sana Khan")
expect("give skills", "PUT", "/api/candidate/profile", 200, limited, {"skills": "Python, Spark", "experienceYears": 2})
codes = [call("GET", "/api/ai/job-matches", limited)[0] for _ in range(11)]
check("first 10 allowed", all(c == 200 for c in codes[:10]), codes)
check("11th -> 429", codes[10] == 429, codes)
code, d = call("GET", "/api/ai/job-matches", limited)
check("429 has friendly message", code == 429 and "wait a minute" in detail(d), d)
expect("other users unaffected", "GET", "/api/ai/job-matches", 200, neha)
expect("latest analysis is not rate limited", "GET", "/api/ai/resume-analysis", 404, limited)

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
