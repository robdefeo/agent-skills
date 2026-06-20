#!/usr/bin/env python3
"""Programmatic grader for the scratchpad skill evals. Writes grading.json per run.

Usage: python grade.py <iteration-dir>   (default: ./runs/iteration-1)
"""
import json, os, re, glob, sys

_here = os.path.dirname(os.path.abspath(__file__))
WS = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(_here, "runs", "iteration-1")

def read(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""

def run_dir(eval_dir, cfg):
    return os.path.join(WS, eval_dir, cfg)

def capture_text(repo):
    """Whatever note/scratchpad file the run produced."""
    for name in ("SCRATCHPAD.md", "NOTES.md"):
        p = os.path.join(repo, name)
        if os.path.exists(p):
            return read(p)
    # any other top-level .md that isn't a fixture standard
    for p in glob.glob(os.path.join(repo, "*.md")):
        return read(p)
    return ""

def grade(text, passed, evidence):
    return {"text": text, "passed": bool(passed), "evidence": evidence}

HEADING_RE = re.compile(r"###\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\s+·\s+(task|idea|discovery|question)")

def grade_eval0(cfg):
    repo = os.path.join(run_dir("eval-0-explicit-capture-cold-start", cfg), "repo")
    out = os.path.join(run_dir("eval-0-explicit-capture-cold-start", cfg), "outputs")
    sp = os.path.join(repo, "SCRATCHPAD.md")
    txt = read(sp)
    gi = read(os.path.join(repo, ".gitignore"))
    transcript = read(os.path.join(out, "transcript.md"))
    res = []
    res.append(grade("Capture file is named SCRATCHPAD.md (skill convention)",
                     os.path.exists(sp),
                     f"SCRATCHPAD.md exists: {os.path.exists(sp)}; files: {sorted(os.listdir(repo))}"))
    res.append(grade("Uses skill structure (# Scratchpad H1 + ## Active + ## Archive)",
                     ("# Scratchpad" in txt and "## Active" in txt and "## Archive" in txt),
                     f"has H1={'# Scratchpad' in txt}, Active={'## Active' in txt}, Archive={'## Archive' in txt}"))
    m = HEADING_RE.search(txt)
    res.append(grade("Entry heading uses '### YYYY-MM-DD HH:MM · <type>' with type task/discovery",
                     bool(m) and m.group(1) in ("task", "discovery"),
                     f"match: {m.group(0) if m else None}"))
    res.append(grade("Captured item is about session token rotation",
                     ("token" in txt.lower() and ("rotat" in txt.lower())),
                     f"mentions token+rotate: {'token' in txt.lower() and 'rotat' in txt.lower()}"))
    res.append(grade("SCRATCHPAD.md is gitignored (.gitignore lists it)",
                     bool(re.search(r"(?m)^SCRATCHPAD\.md\s*$", gi)),
                     f".gitignore tail: {gi.strip().splitlines()[-3:]}"))
    res.append(grade("Parking only — no source code changes for token rotation",
                     ("session.js" not in transcript.split('git status')[-1] if 'git status' in transcript else True),
                     "checked git status section of transcript for src changes"))
    return res

def grade_eval1(cfg):
    repo = os.path.join(run_dir("eval-1-auto-capture-midtask", cfg), "repo")
    out = os.path.join(run_dir("eval-1-auto-capture-midtask", cfg), "outputs")
    users = read(os.path.join(repo, "src", "users.js"))
    txt = capture_text(repo)
    sp = os.path.join(repo, "SCRATCHPAD.md")
    sptxt = read(sp)
    gi = read(os.path.join(repo, ".gitignore"))
    transcript = read(os.path.join(out, "transcript.md"))
    res = []
    has_validation = ("throw" in users and re.search(r"name", users) and re.search(r"email", users)
                      and users.index("throw") < users.index("INSERT INTO"))
    res.append(grade("createUser validates & rejects empty/missing name and email before the INSERT",
                     bool(has_validation),
                     f"throw present={'throw' in users}, before INSERT={('throw' in users and 'INSERT INTO' in users and users.index('throw') < users.index('INSERT INTO'))}"))
    captured = ("concatenation" in txt.lower() or "injection" in txt.lower())
    res.append(grade("Out-of-scope SQL-injection issue was captured",
                     captured,
                     f"note mentions concat/injection: {captured}"))
    skill_fmt = ("# Scratchpad" in sptxt and HEADING_RE.search(sptxt) is not None)
    res.append(grade("Capture uses skill format (SCRATCHPAD.md with # Scratchpad + '### … · <type>' entry)",
                     skill_fmt,
                     f"SCRATCHPAD.md H1={'# Scratchpad' in sptxt}, typed-heading={HEADING_RE.search(sptxt) is not None}"))
    res.append(grade("SCRATCHPAD.md is gitignored (.gitignore lists it)",
                     bool(re.search(r"(?m)^SCRATCHPAD\.md\s*$", gi)),
                     f".gitignore lines: {gi.strip().splitlines()}"))
    not_fixed = ("'\" + name + \"'" in users) or ('" + name + "' in users) or ("+ name +" in users)
    res.append(grade("SQL injection NOT fixed (string-concat INSERT still present) — scope respected",
                     bool(not_fixed),
                     f"concat INSERT still present: {bool(not_fixed)}"))
    notice = ("parked in SCRATCHPAD" in transcript) or re.search(r"↳\s*parked", transcript)
    res.append(grade("Inline 'parked in SCRATCHPAD' notice printed to the user (transparent capture)",
                     bool(notice),
                     f"notice in transcript: {bool(notice)}"))
    return res

def grade_eval2(cfg):
    repo = os.path.join(run_dir("eval-2-retrieve-lifecycle-promote", cfg), "repo")
    out = os.path.join(run_dir("eval-2-retrieve-lifecycle-promote", cfg), "outputs")
    txt = read(os.path.join(repo, "SCRATCHPAD.md"))
    transcript = read(os.path.join(out, "transcript.md"))
    # split into Active / Archive sections
    active, archive = txt, ""
    if "## Archive" in txt:
        active, archive = txt.split("## Archive", 1)
    res = []
    auth_done = bool(re.search(r"-\s*\[x\].*auth guard", txt, re.I))
    res.append(grade("Auth-guard task marked done (- [x])", auth_done,
                     f"auth guard [x] present: {auth_done}"))
    auth_in_active = bool(re.search(r"auth guard", active, re.I)) and not bool(re.search(r"auth guard", archive, re.I))
    res.append(grade("Auth-guard task remains in ## Active (ticked in place, not auto-archived)",
                     auth_in_active,
                     f"auth in Active={bool(re.search(r'auth guard', active, re.I))}, in Archive={bool(re.search(r'auth guard', archive, re.I))}"))
    ci_in_archive = bool(re.search(r"flaky|CI image|digest", archive, re.I))
    res.append(grade("Flaky-CI task moved to ## Archive", ci_in_archive,
                     f"CI entry in Archive: {ci_in_archive}"))
    promoted_ptr = bool(re.search(r"↳\s*promoted:\s*issue\s*#215", txt))
    res.append(grade("Flaky-CI entry has standardized '↳ promoted: issue #215' pointer line",
                     promoted_ptr,
                     f"standardized pointer present: {promoted_ptr}"))
    issue_drafted = ("issue" in transcript.lower() and ("title" in transcript.lower() or "## " in transcript))
    res.append(grade("A GitHub issue (title + body) was drafted in the reply",
                     issue_drafted,
                     f"issue draft in transcript: {issue_drafted}"))
    others_intact = ("double-charge" in txt and "config reload" in txt)
    res.append(grade("Other Active items (Stripe question, config idea) left intact",
                     others_intact,
                     f"stripe={'double-charge' in txt}, config-idea={'config reload' in txt}"))
    return res

GRADERS = {
    "eval-0-explicit-capture-cold-start": grade_eval0,
    "eval-1-auto-capture-midtask": grade_eval1,
    "eval-2-retrieve-lifecycle-promote": grade_eval2,
}

for eval_dir, fn in GRADERS.items():
    for cfg in ("with_skill", "without_skill"):
        expectations = fn(cfg)
        passed = sum(1 for e in expectations if e["passed"])
        grading = {
            "run_id": f"{eval_dir}-{cfg}",
            "passed": passed,
            "total": len(expectations),
            "expectations": expectations,
        }
        path = os.path.join(run_dir(eval_dir, cfg), "grading.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(grading, f, indent=2, ensure_ascii=False)
        print(f"{eval_dir:42s} {cfg:14s} {passed}/{len(expectations)}")
