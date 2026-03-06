# Drafting and Rewriting Guide

Use this guide when creating or rewriting documentation.

## Required preface

Before draft content, include:

- `Mode: <tutorial|how-to guide|reference|explanation>`
- `Why this mode: <one-line rationale>`

## Accuracy and source-of-truth policy

- Use only user-provided context and repository content for factual content.
- Do not invent facts.
- If required facts are missing, explicitly list:
  - `Assumptions`
  - `Open questions`

## Combined classification and drafting

When a request includes both:

1. Return classification first with the fixed 4-part structure.
2. If full-page scope/length is missing, ask for scope before drafting.
3. Otherwise produce the draft in the selected mode.

If user-requested mode conflicts with classifier result:

- Report classifier outcome in `Category`.
- Draft in user-requested mode.
- Add a mismatch warning and likely tradeoffs before draft content.

## Verification checklist requirement

For drafting/rewriting outputs, include a `Verification checklist` with concrete checks for:

- Mode alignment (structure matches selected mode)
- Fact grounding (no invented details)
- Assumptions/open questions explicitly listed when needed
- Safe examples (no secrets, placeholders only)
- Clear next actions for the contributor
