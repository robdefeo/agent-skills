#!/usr/bin/env bun
/**
 * scaffold.ts <doc-path>
 *
 * Bootstrap a panel folder for a document.
 *
 * Creates {doc}.panel/ with:
 *   - README.md (objectives + persona library + round log)
 *   - personas/   (defaults copied from skill's personas/)
 *   - round-01/   (skeleton: source.md frozen + sha256 + index.md + empty reviews/ and findings/)
 *
 * On re-invocation, detects existing {doc}.panel/ and appends round-NN+1
 * (does NOT re-create personas or README).
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const SKILL_ROOT = resolve(import.meta.dir, "..");
const SKILL_PERSONAS_DIR = join(SKILL_ROOT, "personas");
const SKILL_TEMPLATES_DIR = join(SKILL_ROOT, "templates");

function die(msg: string): never {
  console.error(`scaffold: ${msg}`);
  process.exit(1);
}

function sha256(path: string): string {
  const data = readFileSync(path);
  return createHash("sha256").update(data).digest("hex");
}

function readTemplate(name: string): string {
  return readFileSync(join(SKILL_TEMPLATES_DIR, name), "utf8");
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, value);
  }
  return out;
}

function nextRoundNumber(panelDir: string): number {
  if (!existsSync(panelDir)) return 1;
  const existing = readdirSync(panelDir)
    .filter((name) => /^round-\d{2,}$/.test(name))
    .map((name) => parseInt(name.slice("round-".length), 10))
    .filter((n) => Number.isFinite(n));
  return existing.length === 0 ? 1 : Math.max(...existing) + 1;
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function defaultPersonaNames(): string[] {
  return readdirSync(SKILL_PERSONAS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.slice(0, -".md".length))
    .sort();
}

function copyDefaultPersonas(targetDir: string): string[] {
  mkdirSync(targetDir, { recursive: true });
  const names = defaultPersonaNames();
  for (const name of names) {
    const src = join(SKILL_PERSONAS_DIR, `${name}.md`);
    const dst = join(targetDir, `${name}.md`);
    if (!existsSync(dst)) copyFileSync(src, dst);
  }
  return names;
}

function writeReadme(panelDir: string, docName: string, personas: string[]): void {
  const template = readTemplate("README.md");
  const personaIndex = personas
    .map((p) => `- \`personas/${p}.md\``)
    .join("\n");
  // The template uses placeholder lines for personas; we substitute a generated index instead.
  const filled = fillTemplate(template, {
    DOC_NAME: docName,
    OBJECTIVES_HERE: "<!-- TODO: fill in 2-5 lines describing what this doc must achieve -->",
  }).replace(
    /- `personas\/skeptic\.md`[\s\S]*?<!-- add objective-derived or user-supplied personas as they're created -->/,
    `${personaIndex}\n<!-- add objective-derived or user-supplied personas as they're created -->`,
  );
  writeFileSync(join(panelDir, "README.md"), filled);
}

function writeRoundIndex(
  roundDir: string,
  roundNumber: number,
  sourceSha: string,
  personas: string[],
): void {
  const template = readTemplate("round-index.md");
  // Replace the panel block (3 placeholder lines) with the actual personas.
  const panelYaml = personas.map((p) => `  - ${p}`).join("\n");
  const filled = template
    .replace(/  - \{PERSONA_1\}\n  - \{PERSONA_2\}\n  - \{PERSONA_3\}/, panelYaml)
    .replaceAll("{ROUND_NUMBER}", pad2(roundNumber))
    .replaceAll("{SOURCE_SHA256}", sourceSha)
    .replace(
      "{COMPOSITION_RATIONALE}",
      "<!-- TODO: explain why this panel for this round -->",
    );
  writeFileSync(join(roundDir, "index.md"), filled);
}

function ensureSourceCopy(roundDir: string, docPath: string): { sourcePath: string; sha: string } {
  const sourcePath = join(roundDir, "source.md");
  copyFileSync(docPath, sourcePath);
  const sha = sha256(sourcePath);
  return { sourcePath, sha };
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 1 || args[0] === "-h" || args[0] === "--help") {
    console.log("Usage: bun run scripts/scaffold.ts <doc-path>");
    process.exit(args.length < 1 ? 1 : 0);
  }
  const docPath = resolve(args[0]!);

  if (!existsSync(docPath) || !statSync(docPath).isFile()) {
    die(`doc not found: ${docPath}`);
  }

  const docDir = dirname(docPath);
  const docName = basename(docPath);
  const panelDir = join(docDir, `${docName}.panel`);

  const isFirstRun = !existsSync(panelDir);
  if (isFirstRun) mkdirSync(panelDir, { recursive: true });

  // Personas: copy defaults on first run; do nothing on subsequent runs (library is mutable, owned by user).
  const personasDir = join(panelDir, "personas");
  if (isFirstRun) {
    copyDefaultPersonas(personasDir);
    writeReadme(panelDir, docName, defaultPersonaNames());
  }

  // Round folder: always a fresh one with the next number.
  const roundN = nextRoundNumber(panelDir);
  const roundDir = join(panelDir, `round-${pad2(roundN)}`);
  if (existsSync(roundDir)) die(`round folder already exists: ${roundDir}`);
  mkdirSync(roundDir);
  mkdirSync(join(roundDir, "reviews"));
  mkdirSync(join(roundDir, "findings"));

  const { sha } = ensureSourceCopy(roundDir, docPath);

  // Use whatever personas currently exist in the library — user may have edited.
  const personas = readdirSync(personasDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.slice(0, -".md".length))
    .sort();

  writeRoundIndex(roundDir, roundN, sha, personas);

  console.log(JSON.stringify(
    {
      doc: docPath,
      panel_dir: panelDir,
      round: pad2(roundN),
      round_dir: roundDir,
      first_run: isFirstRun,
      personas,
      source_sha256: sha,
    },
    null,
    2,
  ));
}

main();
