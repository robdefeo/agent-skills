# Agent Skills

A collection of skills for AI coding agents.

Skills follow the [Agent Skills](https://agentskills.io/) format and are published via [skills.sh](https://skills.sh).

## Installation

```
npx skills add https://github.com/robdefeo/agent-skills
```

## Available Skills

### amazon-working-backwards

Guide the Amazon Working Backwards process from the 5 Questions through to a full PR-FAQ document.

**Installation:**

```
npx skills add https://github.com/robdefeo/agent-skills --skill amazon-working-backwards
```

**Use when:**

- Drafting answers to the Amazon 5 Questions for a proposal or idea
- Refining or critiquing existing 5Q answers
- Verifying and challenging 5Q answers with probing questions
- Generating a PR-FAQ document from 5Q answers
- Reviewing or critiquing an existing PR-FAQ against Amazon standards

### para-second-brain

Guide PARA-based second brain organization with decision trees, workflows, examples, and validation tooling.

**Installation:**

```
npx skills add https://github.com/robdefeo/agent-skills --skill para-second-brain
```

**Use when:**

- Deciding where new notes or files should be organized in PARA
- Distinguishing Projects vs Areas vs Resources vs Archives
- Running inbox processing, monthly reviews, project setup, completion, or archiving workflows
- Troubleshooting stale projects, orphaned files, or structure issues
- Validating second brain structure and project health with `scripts/validate.sh`

## Skill Structure

Each skill contains:

- `SKILL.md` — Instructions for the agent
- `references/` — Supporting documentation (optional)
- `scripts/` — Helper scripts for automation (optional)
- `assets/` — Files used in output (optional)
