---
name: skill-scope
description: >
  Decide how to scope a Claude skill before building or restructuring it: what belongs in
  one skill, what splits off, what merges, whether the work needs a new skill at all.
  Use BEFORE skill-creator whenever the user is (1) creating a new skill, (2) significantly
  restructuring or expanding an existing skill, (3) splitting one skill into two or merging
  two into one, or (4) unsure whether a workflow needs a new skill vs. extending an existing
  one. Skill-creator should not start scaffolding until skill-scope has run.
  Fires on: "create a skill", "make a skill", "new skill", "design a skill", "build a skill",
  "scope this skill", "should this be one skill or two", "is this skill too big",
  "is this skill too narrow", "where does this skill belong", "split this skill",
  "merge these skills", restructuring an existing skill, or `/skill-scope`.
  Skip for trivial edits where scope is settled (typos, trigger phrase tweaks, body rewording,
  packaging) — these don't reopen scope decisions.
---

# Skill Scope

Decide the shape of a Claude skill before `skill-creator` builds it. Run four phases: fast-path check, scoping tests, explicit verdict, handoff.

---

## Workflow

1. **Fast-path check** — if scope is already settled, confirm in one line and skip to handoff.
2. **Apply scoping tests** — run the relevant tests below. Don't read all of them on every invocation; pull only the ones that fit the situation.
3. **State the verdict** — exactly one of: `NEW` / `EXTEND` / `SPLIT` / `MERGE`. No hedging.
4. **Hand off** — to `skill-creator` with the verdict and a one-sentence responsibility statement.

---

## Phase 1 — Fast-path check

Scope is already settled when the user's message:

- Names a clear single responsibility and a unique skill name (e.g., "make a skill for converting CSV files to Markdown tables").
- Explicitly states the verdict ("I want to add a new phase to `pr-create`", "split `monolith-skill` into X and Y").
- Confirms a previous scoping discussion ("we already agreed it's a new skill, just build it").

In those cases:

> "Scope checks out: <verdict> — <one-sentence responsibility>. Handing off to skill-creator."

Then go straight to Phase 4. Do not run the test suite.

Scope is **not** settled when the user:
- Asks "should this be one skill or two?" or any phrasing of the scope question itself.
- Describes a workflow without committing to it being a skill.
- Names an existing skill that might already cover the work.
- Proposes a skill whose responsibility overlaps multiple existing skills.

Continue to Phase 2.

---

## Phase 2 — Scoping tests

Apply only the tests relevant to the situation. Each test is a yes/no question with a consequence. Name the test by number in your response so the user can follow your reasoning.

### Test 1 — Atomic responsibility

> Does this have one logical responsibility, even if it takes multiple steps?

Atomic ≠ one step. Multi-phase skills are normal *when all phases serve one responsibility*. The real test:

> If you split it, do the pieces share state — objectives, history, intermediate artifacts — that would be painful to pass between separate skill invocations?

- Shared state → keep it together.
- No shared state → split candidate.

### Test 2 — Trigger timing

> Do all the parts fire on the same user intent?

A skill is invoked by description-matching. If parts fire on different intents ("draft a PRD" vs "review a PRD"), they want separate descriptions — and separate skills.

### Test 3 — Overlap with existing

> Does an existing skill already cover this responsibility, or part of it?

New skills cost description tokens in every session, forever. Default to extending an existing skill unless:

- The responsibility is genuinely distinct.
- Trigger phrases don't overlap with the existing skill (forced ambiguity is a tax on Claude's trigger choice).
- The existing skill's body would have to grow substantially to absorb the new work.

### Test 4 — Scope drift in an existing skill

> Has an existing skill grown past one responsibility?

Symptoms:
- Multiple unrelated trigger-phrase clusters in the description.
- Body sections that don't reference each other.
- Two natural names you could give the skill.

If yes → `SPLIT`.

### Test 5 — Duplicate responsibility across skills

> Do two skills serve the same responsibility from different angles?

Symptoms:
- Overlapping trigger phrases that confuse trigger choice.
- Users invoke them interchangeably.
- Both bodies repeat the same domain content.

If yes → `MERGE`. **But** distinct trigger phrases usually signal distinct intents — leave them alone unless the overlap is clear.

---

## Phase 3 — State the verdict

Pick exactly one:

| Verdict | Fires when |
|---|---|
| **`NEW`** | Tests 1–3 pass; responsibility is distinct from anything existing. |
| **`EXTEND`** | Test 3 fires; the work fits inside an existing skill. |
| **`SPLIT`** | Test 4 fires; an existing skill has drifted past one responsibility. |
| **`MERGE`** | Test 5 fires; two existing skills cover the same responsibility. |

State the verdict explicitly, in this format:

> **Verdict: `<NEW | EXTEND | SPLIT | MERGE>`**
> Responsibility: `<one sentence>`
> Name(s): `<proposed-name>` or `<target-skill-to-modify>`
> Reasoning: tests `<numbers>` fired.

If you can't pick exactly one verdict, that's the signal. Surface to the user and don't hand off — the scope question isn't settled yet.

---

## Phase 4 — Hand off

| Verdict | Handoff |
|---|---|
| `NEW` | Invoke `skill-creator` with the verdict block. Scope is done; let it build. |
| `EXTEND` | Name the target skill and the proposed addition. Hand off to `skill-creator`'s update path. |
| `SPLIT` | Produce a one-line responsibility statement for each resulting skill *before* any restructuring. Hand off one skill at a time. |
| `MERGE` | Produce a single responsibility statement for the merged skill and a list of trigger phrases to consolidate. Hand off as an `EXTEND` of the surviving skill, plus a delete of the other. |

---

## Anti-patterns

- **One step per skill.** Atomic means responsibility, not step count. Multi-phase skills are normal.
- **Splitting prematurely.** If the pieces share state, keep them together. Awkward state-passing between skills is worse than a longer skill.
- **Forking when extending would do.** New skills cost description tokens in every session, forever; extensions are cheap.
- **Merging for tidiness.** Distinct trigger phrases usually serve distinct user intents — leave them alone unless overlap is concrete.
- **Re-litigating settled scope.** If the user has stated the verdict, Phase 1 exits. Don't run tests for show.
- **Hedged verdicts.** "Probably a new skill, maybe an extension" is not a verdict — surface the ambiguity to the user instead.


