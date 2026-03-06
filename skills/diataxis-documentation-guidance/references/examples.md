# Mode-Appropriate Examples

## Example 1: Classification-only request

Request: "Should my page about setting up local auth be a tutorial or how-to?"

Response shape:

- Category: How-to guide
- Why: User intent is work + action (complete setup now).
- Split recommendations: Keep conceptual auth model in a separate explanation page.
- Next step: Draft a task-oriented how-to with prerequisites and verification steps.

## Example 2: Combined classification + drafting

Request: "Classify and draft docs for rotating API keys in production."

- Classification first (4 parts).
- Then draft with:
  - Mode
  - Why this mode
  - Content
  - Verification checklist

## Example 3: Conflict between classifier and requested mode

Request: "Use explanation mode, but classify this page about creating a backup now."

- Category reports classifier result (How-to guide).
- Draft proceeds in requested explanation mode.
- Include warning: explanation may reduce immediate task executability.

## Example 4: Missing scope for full-page draft

Request: "Draft the entire tutorial for deployment."

- Return classification first.
- Ask scope question before drafting, for example:
  - target audience and prerequisites
  - expected length
  - environment constraints
