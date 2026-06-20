---
name: panel-review
description: Run one round of panel review on a document — multiple reviewer personas critique in parallel, then a consolidated feedback set anchored on stated objectives. Use when the user wants a review pass from multiple angles — phrases like "review this from different perspectives", "panel review this", "stress test this doc", "what would [skeptic/target reader/expert] say about this", "give me a multi-angle review", "review pass before I send this", or invokes `/panel-review`. Skip when the user wants only a single reviewer's perspective.
---

# Panel Review

Run **one round** of panel review on a document. A configured set of reviewer personas critique the doc in parallel (isolated contexts), then a consolidation phase merges their findings into a short canonical set anchored on the doc's objectives.

**Output is findings, not edits.** Applying findings is out of scope — hand-edit the doc yourself, or hand off to a future iteration skill.

**One invocation = one round.** Each invocation appends a new `round-NN/` to the panel folder. Iteration to convergence (looping rounds until reviews stabilise) is a separate concern, deferred to a future `converge-review` skill that drives this one round-over-round.

## When this skill applies

- The doc benefits from multiple distinct perspectives (skeptic, target audience, domain expert, etc.).
- The doc has — or you can articulate in 2–5 lines — concrete objectives. Without objectives, the panel has nothing to anchor against.
- You want round-over-round iteration: each invocation appends a new round to the same panel folder, so you can compare findings across revisions of the doc.

## When to skip

- You want a single reviewer's read — edit / review directly, no skill needed.
- You want fully automated iteration to convergence — different skill (deferred).
- The doc has no objectives and none can be articulated.

## Inputs

- **P0 — doc path**: path to the document under review (markdown is first-class for v1; other formats accepted, but ask the user to confirm).
- **P1 — objectives**: 2–5 line statement of what the doc must achieve.

Try to infer both from repo context first — a sibling `OBJECTIVES.md`, references inside the doc, an obvious doc path the user is talking about. Ask once if ambiguous. **Never proceed with empty objectives** — without them, the panel has nothing to anchor against and the output is noise.

## Phases

### Phase 0 — Detect existing panel

Look for an existing `{doc}.panel/` folder next to the doc.

- **Exists**: ask once, "Continue this panel, appending round-NN+1?" If yes, jump to Phase 2 with existing personas (skip persona setup). If no, ask the user to delete or rename the folder before re-running.
- **Doesn't exist**: continue to Phase 1.

### Phase 1 — Set up panel (first run only)

1. Create `{doc}.panel/`.
2. Capture objectives → write `README.md` using `templates/README.md`. Required sections: Objectives, Persona library index, Round log.
3. Propose panel composition:
   - **Defaults**: `skeptic`, `target-reader`, `domain-expert` (copy from this skill's `personas/`).
   - **Objective-derived**: read the objectives, propose personas they imply. "Convince a CFO" → propose `cfo`. "Must be actionable for a designer" → propose `designer`. "Regulatory approval required" → propose `regulator`. One or two extras maximum; don't drown the panel.
4. Write each proposed persona's definition into `{doc}.panel/personas/{name}.md` using `templates/persona.md`.
5. **Pause for the user.** Show the proposed panel. The user may edit any `personas/{name}.md`, add new ones, or remove proposed ones before Phase 2.

The persona library at `{doc}.panel/personas/` is the **single source of truth** for persona definitions. Persona files are mutable across rounds; git history catches the evolution. A persona that's only used in one round still lives in the library — the per-round `index.md` decides which subset of the library is on the panel that round.

### Phase 2 — Declare this round's panel

Determine the next round number: `NN = max(existing round-XX) + 1`, or `01` if first round.

Create `round-NN/` and write `index.md` using `templates/round-index.md`. Frontmatter:

```yaml
---
round: NN
source:
  file: source.md
  sha256: <computed in Phase 3>
panel:
  - skeptic
  - target-reader
  - cfo
---
```

Body: a paragraph explaining the composition — why these personas, why any additions or removals from the prior round. Optional: a round-specific objective focus that narrows or overrides the doc-level objectives for this round only.

**Pause for user confirmation** on the panel composition before fan-out.

### Phase 3 — Freeze source and fan out reviews

1. Copy the live `{doc}.md` to `round-NN/source.md`, byte-identical. This freezes the doc as it existed at the start of this round. Compute `sha256(source.md)` and write it into `index.md` frontmatter.
2. For each persona in this round's panel, spawn an **isolated Task** (use the Task tool — one Task call per persona, all dispatched in the same turn so they run concurrently).

Each Task receives only:
- The frozen `round-NN/source.md`
- The objectives (from `README.md`)
- The persona's definition (from `personas/{name}.md`)
- An instruction to write its findings to `round-NN/reviews/{persona}/findings/NN-{slug}.md`, one file per finding, using the schema below.

**Personas do not see each other's reviews.** Isolated contexts are load-bearing — cross-contamination collapses the panel into one perspective.

Personas may disagree with the objectives. Disagreement is preserved as a finding (anchor: `contradicts-objectives` or `ignores-objectives`), not suppressed.

A persona may also write an optional `round-NN/reviews/{persona}/notes.md` — a place for persona-level meta-observations that aren't findings (assumed audience for `target-reader`, assumed domain for `domain-expert`, etc.).

### Phase 4 — Consolidate

Read every `round-NN/reviews/*/findings/*.md`. Produce consolidated findings in `round-NN/findings/`, plus an index `round-NN/consolidation.md`, plus an empty annotation scaffold `round-NN/human.md`.

**Consolidation is lightweight.** Each consolidated finding is a 1–3 sentence **canonical merged statement** — written fresh as a merge of source review findings, *not* a copy-paste of any review body. Full per-persona reasoning stays in the linked review finding files. The consolidation layer earns its keep by doing four things review files can't:

1. **Merge near-duplicates** into a single canonical statement. If skeptic writes "no evidence for 3x ARR", CFO writes "revenue model missing", and domain-expert writes "forecast lacks comparables", those are the same underlying finding — consolidate into one entry with three sources.
2. **Surface cross-persona agreement** as confidence signal. Multiple sources on one finding is a stronger signal than the finding's individual prose.
3. **Surface conflicts as their own attention category.** When personas disagree, preserve both findings as separate entries and link them via `conflict_with`.
4. **Anchor against objectives.** Each finding names which objective it serves, or that it ignores/contradicts the objectives.

If consolidation isn't doing those four things, it shouldn't exist — don't write a narrative summary in its place.

Each `round-NN/findings/NN-{slug}.md` follows `templates/consolidation-finding.md`:

```yaml
---
id: <slug>
severity: <highest from sources, typically>
sources:
  - reviews/skeptic/findings/03-arr-unsupported.md
  - reviews/cfo/findings/01-revenue-model-missing.md
references:
  - lines: [42, 48]
    quote: "..."
objective_anchor: <objective-slug>  # or ignores-objectives / contradicts-objectives
conflict_with: []                    # IDs of other findings this conflicts with
---
[1-3 sentence canonical merged statement.]
```

`consolidation.md` is a short index using `templates/consolidation-index.md`: counts, conflict labels, links to the finding files. No narrative.

`human.md` is created using `templates/human.md` — empty annotation scaffold. The user can mark each finding `apply` / `defer` / `ignore` inline. This is the **only mutable file** in `round-NN/`.

### Phase 5 — Hand off

Print:
- Path to `round-NN/consolidation.md`
- Summary line: `N findings, X conflicts`
- Reminder: `human.md` is where to mark which findings to act on.

Skill exits. The user decides whether to hand-edit the doc, re-invoke for another round, or stop.

## File and folder conventions

```
{doc}.md
{doc}.panel/
  README.md                       # doc-level: objectives, persona library index, round log
  personas/                       # shared library — single source of truth for persona definitions
    skeptic.md
    target-reader.md
    domain-expert.md
    cfo.md                        # added per run from objective-derivation or user request
  round-NN/
    index.md                      # frontmatter: round#, source hash, panel; body: composition rationale
    source.md                     # frozen byte-identical copy of doc; hash verified by validate.ts
    reviews/
      {persona}/
        notes.md                  # optional persona meta
        findings/
          01-{slug}.md            # one file per finding, with frontmatter
          02-{slug}.md
    findings/
      01-{slug}.md                # consolidation finding — lightweight, with sources pointers
      02-{slug}.md
    consolidation.md              # short index — counts, conflict labels, links to findings/
    human.md                      # ONLY mutable file in round-NN — user annotations
```

**Immutability:** everything in `round-NN/` except `human.md` is written once and never modified. Each invocation creates a fresh `round-NN/` with the next number — never overwrites a prior round.

## Schemas

### Round index (`round-NN/index.md` frontmatter)

```yaml
---
round: 01
source:
  file: source.md
  sha256: <hex-digest>
panel:
  - skeptic
  - target-reader
  - cfo
---
```

### Review finding (`reviews/{persona}/findings/NN-{slug}.md`)

```yaml
---
severity: blocking | serious | minor
references:
  - lines: [42, 48]
    quote: "exact quote from source.md"
  # references is a LIST length 1..N — supports multi-reference observations
  # (contradictions across the doc, recurring patterns, cross-section relationships)
objective_anchor: <objective-slug> | ignores-objectives | contradicts-objectives
---

[Full prose body: the persona's reasoning. What's missing. What would convince them.
This is where heavy reasoning lives — consolidation findings link back here for depth.]
```

Severity calibration:
- **blocking**: the doc fails its objectives if this isn't addressed.
- **serious**: weakens the doc materially; ought to be addressed before sending.
- **minor**: friction or polish; worth knowing about but won't sink the doc.

### Consolidation finding (`findings/NN-{slug}.md`)

```yaml
---
id: arr-claim-unsupported
severity: serious
sources:
  - reviews/skeptic/findings/03-arr-unsupported.md
  - reviews/cfo/findings/01-revenue-model-missing.md
  - reviews/domain-expert/findings/02-forecast-thin.md
references:
  - lines: [42, 48]
    quote: "We expect ARR to grow 3x in 18 months"
objective_anchor: defensible-business-case
conflict_with: []
---

ARR forecast lacks supporting model, comparables, or stated assumptions.
Three personas converged on this gap. To address: top-down model with named
assumptions, or cite comparable case.
```

The body is **1–3 sentences, written fresh**. Not a copy-paste of any review's body. Heavy reasoning lives in the linked review files.

### References

`references` is always a list. Length 1 for single-point findings. Length 2+ when the observation spans multiple parts of the doc — contradictions, recurring patterns, cross-section relationships. The body prose explains how the references relate; the schema does not encode relationship semantics in v1.

```yaml
# Single point
references:
  - lines: [42, 48]
    quote: "..."

# Contradiction across the doc
references:
  - lines: [42, 48]
    quote: "We expect ARR to grow 3x in 18 months"
  - lines: [200, 215]
    quote: "Current ARR has been flat for 6 quarters"
```

## Anti-patterns

- **Don't produce edits.** Output is findings. Applying them is the user's job (or a future iteration skill's).
- **Don't merge persona reviews into a narrative.** Consolidation is a structured list of canonical short statements + pointers, not a prose summary.
- **Don't suppress conflicts.** Disagreement across personas is signal, not noise — preserve both findings, link via `conflict_with`.
- **Don't reuse round numbers.** Each invocation appends `round-NN+1`. Never overwrite a prior round.
- **Don't run without objectives.** Without an anchor, every finding is opinion. Stop and ask.
- **Don't let personas see each other's reviews.** Isolated contexts are what make the panel valuable — cross-contamination collapses the panel into one perspective.
- **Don't duplicate review body text into consolidation findings.** Consolidation bodies are 1–3 sentence merges; full reasoning stays in linked review files.
- **Don't modify `source.md` or any finding file after `round-NN/` is written.** Only `human.md` is mutable.

## Scripts

Two TypeScript scripts under `scripts/`, run with Bun.

- **`scaffold.ts <doc-path>`** — bootstrap `{doc}.panel/`. Creates the folder structure, copies default personas, captures objectives stub, creates `round-01/` skeleton, freezes `source.md`, computes and stores sha256. Use this in Phase 1 to avoid hand-rolling boilerplate.

- **`validate.ts <panel-folder> [--round NN]`** — verifies the panel folder is well-formed: required files exist, `index.md` frontmatter is valid, `sha256` matches `source.md`, finding files have required frontmatter fields, consolidation findings' `sources` paths resolve to real review finding files. Run after Phase 4 to catch contract drift before handing off — and before any downstream skill consumes the round.

Invoke with `bun run scripts/scaffold.ts <doc-path>` and `bun run scripts/validate.ts <panel-folder>`.

## Working with future skills

This skill is intentionally one round per invocation. Three sibling skills are deferred but should be kept compatible:

- **`converge-review`** — would drive `panel-review` round-over-round, detect convergence (no new findings), and produce revised `vN.md` doc versions between rounds. The structured consolidation findings format (with `id`, `sources`, `references`, `objective_anchor`, `conflict_with`) is the contract that lets `converge-review` track findings across rounds.
- **`persona-library`** — would manage reusable persona definitions across projects. For v1, personas live per-doc in `{doc}.panel/personas/`; if persona reuse across projects becomes valuable, this skill lifts them into a shared library.
- **`objectives-capture`** — would elicit objectives interactively when the user doesn't have them written down. For v1, `panel-review` asks once at the start of Phase 1 and refuses to proceed without them.
