#!/usr/bin/env bun
/**
 * validate.ts <panel-folder> [--round NN]
 *
 * Verifies a panel folder is well-formed:
 *   - Required files exist (README.md, personas/)
 *   - Each round folder has: index.md, source.md
 *   - sha256(source.md) matches the hash in index.md frontmatter
 *   - index.md panel list references personas that actually exist
 *   - Review and consolidation findings have required frontmatter fields
 *   - Consolidation findings' `sources` paths resolve to real review finding files
 *
 * Exit code 0 = all checks pass. Non-zero = at least one failure.
 *
 * If --round NN is given, validates only that round (still validates panel-level files).
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";

type Severity = "error" | "warn";
type Issue = { severity: Severity; where: string; message: string };

const REVIEW_FINDING_REQUIRED = ["severity", "references", "objective_anchor"] as const;
const CONSOLIDATION_FINDING_REQUIRED = [
  "id",
  "severity",
  "sources",
  "references",
  "objective_anchor",
  "conflict_with",
] as const;
const VALID_SEVERITIES = new Set(["blocking", "serious", "minor"]);

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function parseFrontmatter(text: string): Record<string, unknown> | null {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end < 0) return null;
  const yaml = text.slice(4, end);
  // Minimal YAML subset parser: enough to read the schemas we ship.
  // Supports scalars, sequences (- item), and nested 2-space mappings.
  return parseMiniYaml(yaml);
}

function parseMiniYaml(yaml: string): Record<string, unknown> {
  const lines = yaml.split("\n").filter((l) => l.length > 0 && !l.trimStart().startsWith("#"));
  const root: Record<string, unknown> = {};
  type Frame = { indent: number; container: Record<string, unknown> | unknown[]; pendingKey?: string };
  const stack: Frame[] = [{ indent: -1, container: root }];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    const indent = raw.length - raw.trimStart().length;
    const line = raw.trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1]!.indent) stack.pop();
    const frame = stack[stack.length - 1]!;

    if (line.startsWith("- ")) {
      // Sequence entry. Parent must be a sequence container or a mapping-with-pendingKey.
      let seq: unknown[];
      if (Array.isArray(frame.container)) {
        seq = frame.container;
      } else if (frame.pendingKey) {
        seq = [];
        (frame.container as Record<string, unknown>)[frame.pendingKey] = seq;
        stack.push({ indent, container: seq });
        frame.pendingKey = undefined;
      } else {
        // Sequence without a parent key — ignore.
        continue;
      }
      const item = line.slice(2);
      if (item.includes(":") && !item.startsWith("\"") && !item.startsWith("'")) {
        const obj: Record<string, unknown> = {};
        seq.push(obj);
        const [k, ...rest] = item.split(":");
        const value = rest.join(":").trim();
        if (value.length > 0) obj[k!.trim()] = parseScalar(value);
        else stack.push({ indent: indent + 2, container: obj, pendingKey: k!.trim() });
      } else {
        seq.push(parseScalar(item));
      }
      continue;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();

    if (Array.isArray(frame.container)) continue; // can't add map entry to sequence

    if (value.length === 0) {
      // Either a nested mapping or a sequence will follow.
      const child: Record<string, unknown> = {};
      (frame.container as Record<string, unknown>)[key] = child;
      stack.push({ indent, container: child, pendingKey: key });
      // Need to detect sequence-via-next-line: handled by sequence branch above using pendingKey.
      // For mapping case, child gets used directly when next line indents further.
    } else if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1).trim();
      const items = inner.length === 0
        ? []
        : inner.split(",").map((s) => parseScalar(s.trim()));
      (frame.container as Record<string, unknown>)[key] = items;
    } else {
      (frame.container as Record<string, unknown>)[key] = parseScalar(value);
    }
  }
  return root;
}

function parseScalar(v: string): unknown {
  if (v === "null" || v === "~") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  if ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function listRoundDirs(panelDir: string): string[] {
  return readdirSync(panelDir)
    .filter((name) => /^round-\d{2,}$/.test(name))
    .filter((name) => statSync(join(panelDir, name)).isDirectory())
    .sort();
}

function listMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".md"));
}

function checkRequiredFields(
  fm: Record<string, unknown>,
  required: readonly string[],
  where: string,
  issues: Issue[],
): void {
  for (const key of required) {
    if (!(key in fm)) issues.push({ severity: "error", where, message: `missing frontmatter field: ${key}` });
  }
}

function checkSeverity(value: unknown, where: string, issues: Issue[]): void {
  if (typeof value === "string" && !VALID_SEVERITIES.has(value)) {
    issues.push({
      severity: "error",
      where,
      message: `invalid severity '${value}' (expected: blocking | serious | minor)`,
    });
  }
}

function validatePanel(panelDir: string, onlyRound?: number): Issue[] {
  const issues: Issue[] = [];
  if (!existsSync(panelDir)) {
    issues.push({ severity: "error", where: panelDir, message: "panel folder does not exist" });
    return issues;
  }

  const readme = join(panelDir, "README.md");
  if (!existsSync(readme)) {
    issues.push({ severity: "error", where: relative(panelDir, readme) || readme, message: "missing README.md" });
  }

  const personasDir = join(panelDir, "personas");
  if (!existsSync(personasDir)) {
    issues.push({ severity: "error", where: "personas/", message: "missing personas/ directory" });
    return issues;
  }
  const knownPersonas = new Set(
    listMarkdownFiles(personasDir).map((f) => f.slice(0, -".md".length)),
  );

  const roundDirs = listRoundDirs(panelDir);
  if (roundDirs.length === 0) {
    issues.push({ severity: "warn", where: panelDir, message: "no round folders yet" });
    return issues;
  }

  for (const roundName of roundDirs) {
    const roundNum = parseInt(roundName.slice("round-".length), 10);
    if (onlyRound !== undefined && roundNum !== onlyRound) continue;
    issues.push(...validateRound(panelDir, roundName, knownPersonas));
  }

  return issues;
}

function validateRound(panelDir: string, roundName: string, knownPersonas: Set<string>): Issue[] {
  const issues: Issue[] = [];
  const roundDir = join(panelDir, roundName);
  const here = (p: string) => `${roundName}/${p}`;

  const indexPath = join(roundDir, "index.md");
  const sourcePath = join(roundDir, "source.md");

  if (!existsSync(indexPath)) {
    issues.push({ severity: "error", where: here("index.md"), message: "missing index.md" });
  }
  if (!existsSync(sourcePath)) {
    issues.push({ severity: "error", where: here("source.md"), message: "missing source.md" });
  }

  if (existsSync(indexPath) && existsSync(sourcePath)) {
    const fm = parseFrontmatter(readFileSync(indexPath, "utf8"));
    if (!fm) {
      issues.push({ severity: "error", where: here("index.md"), message: "missing or invalid frontmatter" });
    } else {
      const sourceFm = (fm.source ?? {}) as Record<string, unknown>;
      const recordedHash = typeof sourceFm.sha256 === "string" ? sourceFm.sha256 : "";
      const actualHash = sha256(sourcePath);
      if (recordedHash !== actualHash) {
        issues.push({
          severity: "error",
          where: here("index.md"),
          message: `sha256 mismatch — recorded ${recordedHash.slice(0, 12)}..., actual ${actualHash.slice(0, 12)}...`,
        });
      }
      const panel = Array.isArray(fm.panel) ? (fm.panel as unknown[]) : [];
      for (const p of panel) {
        if (typeof p !== "string") continue;
        if (!knownPersonas.has(p)) {
          issues.push({
            severity: "error",
            where: here("index.md"),
            message: `panel references unknown persona '${p}' (not in personas/)`,
          });
        }
      }
    }
  }

  // Review findings.
  const reviewsDir = join(roundDir, "reviews");
  const reviewFindingPaths: string[] = [];
  if (existsSync(reviewsDir)) {
    for (const persona of readdirSync(reviewsDir)) {
      const findingsDir = join(reviewsDir, persona, "findings");
      if (!existsSync(findingsDir)) continue;
      for (const f of listMarkdownFiles(findingsDir)) {
        const path = join(findingsDir, f);
        reviewFindingPaths.push(path);
        const fm = parseFrontmatter(readFileSync(path, "utf8"));
        const where = here(`reviews/${persona}/findings/${f}`);
        if (!fm) {
          issues.push({ severity: "error", where, message: "missing or invalid frontmatter" });
          continue;
        }
        checkRequiredFields(fm, REVIEW_FINDING_REQUIRED, where, issues);
        checkSeverity(fm.severity, where, issues);
        const refs = fm.references;
        if (!Array.isArray(refs) || refs.length === 0) {
          issues.push({ severity: "error", where, message: "references must be a non-empty list" });
        }
      }
    }
  }
  const reviewFindingRelSet = new Set(
    reviewFindingPaths.map((p) => relative(roundDir, p).replaceAll("\\", "/")),
  );

  // Consolidation findings.
  const findingsDir = join(roundDir, "findings");
  if (existsSync(findingsDir)) {
    for (const f of listMarkdownFiles(findingsDir)) {
      const path = join(findingsDir, f);
      const fm = parseFrontmatter(readFileSync(path, "utf8"));
      const where = here(`findings/${f}`);
      if (!fm) {
        issues.push({ severity: "error", where, message: "missing or invalid frontmatter" });
        continue;
      }
      checkRequiredFields(fm, CONSOLIDATION_FINDING_REQUIRED, where, issues);
      checkSeverity(fm.severity, where, issues);
      const sources = fm.sources;
      if (!Array.isArray(sources) || sources.length === 0) {
        issues.push({ severity: "error", where, message: "sources must be a non-empty list" });
      } else {
        for (const s of sources) {
          if (typeof s !== "string") continue;
          if (!reviewFindingRelSet.has(s)) {
            issues.push({
              severity: "error",
              where,
              message: `sources entry does not resolve to a review finding: ${s}`,
            });
          }
        }
      }
    }
  }

  return issues;
}

function parseArgs(): { panelDir: string; round?: number } {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    console.log("Usage: bun run scripts/validate.ts <panel-folder> [--round NN]");
    process.exit(args.length === 0 ? 1 : 0);
  }
  let panelDir = "";
  let round: number | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === "--round") {
      const v = args[++i];
      if (!v) {
        console.error("validate: --round requires a value");
        process.exit(2);
      }
      round = parseInt(v, 10);
    } else if (!panelDir) {
      panelDir = a;
    }
  }
  return { panelDir: resolve(panelDir), round };
}

function main(): void {
  const { panelDir, round } = parseArgs();
  const issues = validatePanel(panelDir, round);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warn");

  for (const i of issues) {
    console.error(`${i.severity.toUpperCase()} ${i.where}: ${i.message}`);
  }
  console.error(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
