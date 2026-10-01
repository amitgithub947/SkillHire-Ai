"""
End-to-end test of the forgot-password flow (forgot-password, verify-otp, reset-password).

Without SMTP settings the API writes emails to its console in Development, so start it
with its output saved to a file, and this script reads the reset codes from there:

    cd backend/SkillHireAI.API
    dotnet run --launch-profile http > /tmp/skillhire_api.log 2>&1

Then:
    python3 scripts/password_reset_test.py [base_url] [api_log_path]

Takes a little over a minute, because one check waits out the 60-second resend cooldown.
"""

import json
import re
import sys
import time
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5052"
LOG = sys.argv[2] if len(sys.argv) > 2 else "/tmp/skillhire_api.log"
RUN = str(int(time.time()))
PASSWORD = "Password123"
NEW_PASSWORD = "NewSecret456"
ADMIN_EMAIL = "admin@skillhire.ai"
GENERIC = "If an employer or candidate account exists for this email"

passed = 0
failed = 0


def call(method, path, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            raw = res.read()
            return res.status, json.loads(raw) if raw else None, raw.decode()
    except urllib.error.HTTPError as err:
        raw = err.read()
        try:
            return err.code, json.loads(raw) if raw else None, raw.decode()
        except json.JSONDecodeError:
            return err.code, None, raw.decode(errors="replace")


def check(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        print(f"  FAIL  {name}  {detail}")


def expect(name, method, path, status, body=None, token=None):
    code, data, raw = call(method, path, token, body)
    check(f"{name} -> {status}", code == status, f"(got {code}: {raw[:300]})")
    return data, raw


def detail(data):
    return data.get("detail", "") if isinstance(data, dict) else ""


def emails_to(address):
    """Every reset code emailed to this address so far, oldest first."""
    with open(LOG, encoding="utf-8", errors="replace") as f:
        text = f.read()
    pattern = rf"To: {re.escape(address)}\s+Subject: [^\n]*\n.*?reset code is (\d{{6}})"
    return re.findall(pattern, text, flags=re.S)


def wait_for_new_code(address, count_before):
    for _ in range(20):
        codes = emails_to(address)
        if len(codes) > count_before:
            return codes[-1]
        time.sleep(0.25)
    return None


def register(role, email, name, company=None):
    body = {"name": name, "email": email, "password": PASSWORD, "confirmPassword": PASSWORD, "role": role}
    if company:
        body["companyName"] = company
    data, _ = expect(f"register {role} {name}", "POST", "/api/auth/register", 201, body)
    return data["token"]


def wrong_code(code):
    return f"{(int(code) + 1) % 1_000_000:06d}"


print(f"\nSkillHire AI forgot-password test against {BASE} (reading emails from {LOG})\n")

candidate = f"reset.cand.{RUN}@example.com"
employer = f"reset.emp.{RUN}@example.com"
cand_token = register("Candidate", candidate, "Reset Candidate")
register("Employer", employer, "Reset Employer", "Reset Co")

print("\nInput validation")
expect("forgot-password without email", "POST", "/api/auth/forgot-password", 400, {})
expect("forgot-password with bad email", "POST", "/api/auth/forgot-password", 400, {"email": "not-an-email"})
expect("verify-otp with 4 digits", "POST", "/api/auth/verify-otp", 400, {"email": candidate, "otp": "1234"})
expect("verify-otp with letters", "POST", "/api/auth/verify-otp", 400, {"email": candidate, "otp": "12ab56"})
data, _ = expect("reset-password weak password", "POST", "/api/auth/reset-password", 400,
                 {"email": candidate, "otp": "123456", "newPassword": "short", "confirmPassword": "short"})
check("  weak password explained", "newPassword" in json.dumps(data).lower() or "NewPassword" in json.dumps(data))
data, _ = expect("reset-password mismatch", "POST", "/api/auth/reset-password", 400,
                 {"email": candidate, "otp": "123456", "newPassword": NEW_PASSWORD, "confirmPassword": "Other12345"})
check("  mismatch explained", "do not match" in json.dumps(data))

print("\nOnly Employer and Candidate accounts can reset")
unknown = f"nobody.{RUN}@example.com"
data, raw = expect("unknown email still answers", "POST", "/api/auth/forgot-password", 200, {"email": unknown})
check("  same generic message", GENERIC in raw)
time.sleep(0.5)
check("  no email sent", emails_to(unknown) == [])

admin_before = len(emails_to(ADMIN_EMAIL))
data, raw = expect("admin email answers the same", "POST", "/api/auth/forgot-password", 200, {"email": ADMIN_EMAIL})
check("  same generic message", GENERIC in raw)
time.sleep(0.5)
check("  admin gets no code", len(emails_to(ADMIN_EMAIL)) == admin_before)
data, _ = expect("admin cannot verify a code", "POST", "/api/auth/verify-otp", 400, {"email": ADMIN_EMAIL, "otp": "123456"})
data, _ = expect("admin cannot reset", "POST", "/api/auth/reset-password", 400,
                 {"email": ADMIN_EMAIL, "otp": "123456", "newPassword": NEW_PASSWORD, "confirmPassword": NEW_PASSWORD})
expect("admin can still log in", "POST", "/api/auth/login", 200, {"email": ADMIN_EMAIL, "password": "Admin@12345"})

print("\nCandidate resets their password")
data, raw = expect("request code (email in capitals)", "POST", "/api/auth/forgot-password", 200, {"email": candidate.upper()})
code = wait_for_new_code(candidate, 0)
check("  code emailed", code is not None)
check("  code not in the response", code is not None and code not in raw)
check("  response has only a message", isinstance(data, dict) and list(data.keys()) == ["message"])

data, raw = expect("request again right away", "POST", "/api/auth/forgot-password", 200, {"email": candidate})
time.sleep(0.5)
check("  cooldown: no second email", len(emails_to(candidate)) == 1)

data, raw = expect("verify wrong code", "POST", "/api/auth/verify-otp", 400, {"email": candidate, "otp": wrong_code(code)})
check("  generic invalid message", "invalid or has expired" in detail(data))
data, raw = expect("verify code for another email", "POST", "/api/auth/verify-otp", 400, {"email": employer, "otp": code})

data, raw = expect("verify correct code", "POST", "/api/auth/verify-otp", 200, {"email": candidate, "otp": code})
check("  has message and expiry", isinstance(data, dict) and data.get("message") and data.get("expiresAt"))
check("  code not echoed", code not in raw)
expect("verify again (still usable before reset)", "POST", "/api/auth/verify-otp", 200, {"email": candidate, "otp": code})

data, _ = expect("reset to the current password", "POST", "/api/auth/reset-password", 400,
                 {"email": candidate, "otp": code, "newPassword": PASSWORD, "confirmPassword": PASSWORD})
check("  must be different", "different" in detail(data))

data, raw = expect("reset password", "POST", "/api/auth/reset-password", 200,
                   {"email": candidate, "otp": code, "newPassword": NEW_PASSWORD, "confirmPassword": NEW_PASSWORD})
check("  no password or code in response", NEW_PASSWORD not in raw and code not in raw and "hash" not in raw.lower())

expect("old password no longer works", "POST", "/api/auth/login", 401, {"email": candidate, "password": PASSWORD})
data, _ = expect("new password works", "POST", "/api/auth/login", 200, {"email": candidate, "password": NEW_PASSWORD})
check("  login still returns a JWT for the same role", data.get("token") and data["user"]["role"] == "Candidate")
expect("token issued before the reset still works", "GET", "/api/auth/me", 200, token=cand_token)

data, _ = expect("reuse code to reset again", "POST", "/api/auth/reset-password", 400,
                 {"email": candidate, "otp": code, "newPassword": "Another789", "confirmPassword": "Another789"})
expect("reuse code to verify", "POST", "/api/auth/verify-otp", 400, {"email": candidate, "otp": code})
expect("password unchanged by reuse attempt", "POST", "/api/auth/login", 200, {"email": candidate, "password": NEW_PASSWORD})

print("\nA new code replaces the old one (waiting 61s for the resend cooldown)")
expect("employer requests code", "POST", "/api/auth/forgot-password", 200, {"email": employer})
first = wait_for_new_code(employer, 0)
check("  first email sent", first is not None)
time.sleep(61)  # also resets the per-minute rate limit window used by the checks above
expect("employer requests another code", "POST", "/api/auth/forgot-password", 200, {"email": employer})
second = wait_for_new_code(employer, 1)
check("  second email sent", second is not None)
expect("older code no longer works", "POST", "/api/auth/verify-otp", 400, {"email": employer, "otp": first})
expect("newest code works", "POST", "/api/auth/reset-password", 200,
       {"email": employer, "otp": second, "newPassword": NEW_PASSWORD, "confirmPassword": NEW_PASSWORD})
data, _ = expect("employer logs in with new password", "POST", "/api/auth/login", 200, {"email": employer, "password": NEW_PASSWORD})
check("  role unchanged", data["user"]["role"] == "Employer")

print("\nToo many wrong codes lock the code")
locked = f"reset.lock.{RUN}@example.com"
register("Candidate", locked, "Lock Candidate")
expect("request code", "POST", "/api/auth/forgot-password", 200, {"email": locked})
lock_code = wait_for_new_code(locked, 0)
check("  code emailed", lock_code is not None)
for i in range(5):
    code_i, _, _ = call("POST", "/api/auth/verify-otp", body={"email": locked, "otp": wrong_code(lock_code)})
    check(f"  wrong try {i + 1} rejected", code_i == 400, f"(got {code_i})")
expect("correct code after 5 wrong tries", "POST", "/api/auth/verify-otp", 400, {"email": locked, "otp": lock_code})
expect("reset with locked code", "POST", "/api/auth/reset-password", 400,
       {"email": locked, "otp": lock_code, "newPassword": NEW_PASSWORD, "confirmPassword": NEW_PASSWORD})
expect("password unchanged", "POST", "/api/auth/login", 200, {"email": locked, "password": PASSWORD})

print("\nRate limit (per IP, per endpoint)")
statuses = [call("POST", "/api/auth/forgot-password", body={"email": unknown})[0] for _ in range(12)]
check("too many requests -> 429", 429 in statuses, f"(got {statuses})")
_, data, _ = call("POST", "/api/auth/forgot-password", body={"email": unknown})
check("  friendly 429 message", "Too many attempts" in detail(data))
expect("login is not rate limited", "POST", "/api/auth/login", 200, {"email": candidate, "password": NEW_PASSWORD})

print(f"\n{passed} passed, {failed} failed\n")
sys.exit(1 if failed else 0)
