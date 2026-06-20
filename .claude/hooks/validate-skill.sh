#!/usr/bin/env bash
# PostToolUse hook (Edit|Write|MultiEdit): validate a skill whenever its SKILL.md
# changes. Reads the tool-call JSON on stdin; no-ops unless the edited file is a
# SKILL.md. On validation failure, prints to stderr and exits 2 so the error is
# fed back to Claude. Mirrors CI: `npx skills-ref validate skills/*/`.

input="$(cat)"

# Parse the edited file path with node — guaranteed present wherever the
# validator (npx skills-ref) can run, so no extra dependency on jq/python.
file="$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{try{const j=JSON.parse(s);console.log((j.tool_input&&j.tool_input.file_path)||"")}catch(e){console.log("")}})' 2>/dev/null)"

# Only act on SKILL.md edits; ignore everything else.
[ "$(basename -- "$file")" = "SKILL.md" ] || exit 0

skill_dir="$(dirname -- "$file")"
out="$(npx --yes skills-ref validate "$skill_dir" 2>&1)"; status=$?

if [ "$status" -ne 0 ]; then
  printf 'skills-ref validation failed for %s:\n%s\n' "$skill_dir" "$out" >&2
  exit 2
fi
exit 0
