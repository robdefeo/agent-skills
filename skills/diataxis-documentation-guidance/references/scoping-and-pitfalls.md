# Scoping, Splitting, and Pitfalls

## Scoping heuristics

- Keep one dominant user need per page.
- Prefer narrow page goals over broad umbrella topics.
- Split when a page shifts between conceptual teaching and task execution.
- Split when reference lookups are buried inside narrative prose.

## Splitting patterns

- Tutorial page links to:
  - explanation for theory/background
  - reference for exact flags/fields/limits
- How-to page links to:
  - reference for options and edge behavior
  - explanation for tradeoffs and rationale

## Difficult contexts

- Cross-cutting audiences with different goals in one page.
- Complex hierarchies where one artifact serves many products.
- Legacy docs that already mix tutorial/how-to/reference/explanation.

Mitigation:

- Pick the dominant user intent first.
- Preserve discoverability with short "Related pages" links.
- Iterate toward cleaner boundaries over multiple edits.

## Common mistakes and corrections

- **Mistake:** tutorial and how-to conflation.
  - **Correction:** keep tutorial guided and instructional; move operational shortcuts to how-to.
- **Mistake:** reference mixed with explanation.
  - **Correction:** keep reference terse and structured; move rationale into explanation.
- **Mistake:** structure-first, user-need-last planning.
  - **Correction:** classify by user intent first, then choose structure.

## Out-of-scope reminder

Repository-wide IA/navigation redesign and doc tree migrations are out of scope for this skill.
