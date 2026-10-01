"""
A tiny stand-in for the OpenAI Chat Completions API, for local testing without a real key.

    python3 scripts/mock_openai.py            # listens on http://localhost:5099

Run the API against it:

    AI__ApiKey=test-key AI__BaseUrl=http://localhost:5099/v1/ dotnet run --launch-profile http

It checks each request like OpenAI's strict structured outputs would, remembers the last
request (GET /__last) so tests can check no personal data was sent, and can simulate
failures (POST /__mode with {"mode": "ok" | "429" | "401" | "500" | "badjson" | "refusal"}).
"""

import json
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = 5099
API_KEY = "test-key"
state = {"mode": "ok", "last": None, "calls": 0}


def check_strict_schema(node, path="schema"):
    """Strict mode: every object lists all properties as required and forbids extras."""
    if isinstance(node, dict):
        if node.get("type") == "object":
            props = node.get("properties", {})
            if node.get("additionalProperties") is not False:
                raise ValueError(f"{path}: additionalProperties must be false")
            if sorted(node.get("required", [])) != sorted(props):
                raise ValueError(f"{path}: every property must be required")
        for key, value in node.items():
            check_strict_schema(value, f"{path}.{key}")
    elif isinstance(node, list):
        for i, value in enumerate(node):
            check_strict_schema(value, f"{path}[{i}]")


def skills_after(label, text):
    match = re.search(rf"^{label}: (.*)$", text, re.MULTILINE)
    if not match or match.group(1) in ("none listed", "not listed"):
        return []
    return [s.strip() for s in match.group(1).split(",") if s.strip()]


def resume_analysis(_text):
    return {
        "summary": "Full stack developer with four years of experience building .NET APIs and React apps.",
        "totalExperienceYears": 4,
        "skills": ["REST API design", "Unit testing", "Code review"],
        "technologies": ["C#", "ASP.NET Core", "React", "TypeScript", "SQL Server", "Docker"],
        "experience": [
            {
                "role": "Software Engineer",
                "organization": "FinEdge Payments",
                "duration": "2022 - Present",
                "highlights": ["Built payment APIs in ASP.NET Core", "Cut page load time by 40% with React code splitting"],
            },
            {"role": "Junior Developer", "organization": "BrightApps", "duration": "2021 - 2022", "highlights": []},
        ],
        "education": [{"degree": "B.Tech in Computer Science", "institution": "JNTU Hyderabad", "year": "2021"}],
        "projects": [
            {
                "name": "Expense Tracker",
                "description": "Personal finance app with charts and monthly budgets.",
                "technologies": ["React", "ASP.NET Core", "SQL Server"],
            }
        ],
    }


def skill_match(text):
    candidate_part, job_part = text.split("JOB", 1)
    mine = {s.lower() for s in skills_after("Skills", candidate_part)}
    needed = skills_after("Skills", job_part) or ["Communication"]
    matched = [s for s in needed if s.lower() in mine]
    missing = [s for s in needed if s.lower() not in mine]
    percent = round(100 * len(matched) / len(needed))
    return {
        "matchPercentage": percent,
        "matchedSkills": matched,
        "missingSkills": missing,
        "summary": f"You have {len(matched)} of the {len(needed)} skills this job asks for.",
    }


def job_matches(text):
    candidate_part, jobs_part = text.split("JOBS", 1)
    mine = {s.lower() for s in skills_after("Skills", candidate_part)}
    matches = []
    for block in jobs_part.strip().split("\n\n"):
        job_id = re.search(r"Job id: (\d+)", block)
        if not job_id:
            continue
        needed = skills_after("Skills", block)
        matched = [s for s in needed if s.lower() in mine]
        percent = round(100 * len(matched) / len(needed)) if needed else 20
        matches.append({
            "jobId": int(job_id.group(1)),
            "matchPercentage": percent,
            "matchedSkills": matched,
            "reason": f"You match {len(matched)} of its {len(needed)} listed skills.",
        })
    # A made-up id the API must ignore.
    matches.append({"jobId": 999999, "matchPercentage": 99, "matchedSkills": [], "reason": "Invented."})
    return {"matches": matches}


BUILDERS = {"resume_analysis": resume_analysis, "skill_match": skill_match, "job_matches": job_matches}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def send_json(self, status, body):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def read_body(self):
        return json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")

    def do_GET(self):
        if self.path == "/__last":
            self.send_json(200, {"last": state["last"], "calls": state["calls"]})
        else:
            self.send_json(404, {"error": "not found"})

    def do_POST(self):
        if self.path == "/__mode":
            state["mode"] = self.read_body().get("mode", "ok")
            return self.send_json(200, {"mode": state["mode"]})

        if self.path != "/v1/chat/completions":
            return self.send_json(404, {"error": {"message": "Unknown path"}})

        state["calls"] += 1
        if self.headers.get("Authorization") != f"Bearer {API_KEY}":
            return self.send_json(401, {"error": {"message": "Incorrect API key provided."}})

        body = self.read_body()
        state["last"] = body
        mode = state["mode"]
        if mode == "429":
            return self.send_json(429, {"error": {"message": "Rate limit reached"}})
        if mode == "401":
            return self.send_json(401, {"error": {"message": "Incorrect API key provided."}})
        if mode == "500":
            return self.send_json(500, {"error": {"message": "Server error"}})

        try:
            fmt = body["response_format"]
            assert fmt["type"] == "json_schema" and fmt["json_schema"]["strict"] is True
            check_strict_schema(fmt["json_schema"]["schema"])
            name = fmt["json_schema"]["name"]
            messages = body["messages"]
            assert body.get("model") and messages[0]["role"] == "system" and messages[1]["role"] == "user"
            content = BUILDERS[name](messages[1]["content"])
        except Exception as ex:  # noqa: BLE001 - report any malformed request as a 400 like OpenAI
            return self.send_json(400, {"error": {"message": f"Invalid request: {ex}"}})

        message = {"role": "assistant", "content": json.dumps(content), "refusal": None}
        if mode == "badjson":
            message["content"] = "this is not json"
        if mode == "refusal":
            message = {"role": "assistant", "content": None, "refusal": "I can't help with that."}

        self.send_json(200, {
            "id": "chatcmpl-mock",
            "object": "chat.completion",
            "model": body["model"],
            "choices": [{"index": 0, "message": message, "finish_reason": "stop"}],
        })


if __name__ == "__main__":
    print(f"Mock OpenAI listening on http://localhost:{PORT}")
    ThreadingHTTPServer(("localhost", PORT), Handler).serve_forever()
