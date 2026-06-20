#!/usr/bin/env bun
// PostToolUse hook (Edit|Write|MultiEdit): validate a skill whenever its
// SKILL.md changes. Mirrors CI (`npx skills-ref validate skills/*/`) so problems
// like an over-long description surface at edit time instead of in the PR.
//
// Reads the tool-call JSON on stdin, no-ops unless the edited file is a
// SKILL.md, then validates that skill's directory. On failure it prints to
// stderr and exits 2 so the error is fed back to Claude.
//
// Requires Bun (https://bun.sh) on PATH.

import { basename, dirname } from "node:path";

interface ToolCall {
  tool_input?: { file_path?: string };
}

const raw = await Bun.stdin.text();

let filePath = "";
try {
  filePath = (JSON.parse(raw) as ToolCall).tool_input?.file_path ?? "";
} catch {
  process.exit(0); // not JSON we understand — nothing to validate
}

// Only act on SKILL.md edits; ignore every other file.
if (basename(filePath) !== "SKILL.md") process.exit(0);

const skillDir = dirname(filePath);
const result = Bun.spawnSync(["npx", "--yes", "skills-ref", "validate", skillDir]);

if (result.exitCode !== 0) {
  const output = (result.stdout.toString() + result.stderr.toString()).trim();
  console.error(`skills-ref validation failed for ${skillDir}:\n${output}`);
  process.exit(2);
}
