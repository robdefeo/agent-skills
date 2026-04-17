# Agent Skills

A collection of skills for AI coding agents.

Skills follow the [Agent Skills](https://agentskills.io/) format and are published via [skills.sh](https://skills.sh).

## Installation

```
npx skills add https://github.com/robdefeo/agent-skills
```

## Available Skills

### diataxis-documentation-guidance

Classify, scope, split, draft, and review documentation using the Diataxis framework.

**Installation:**

```
npx skills add https://github.com/robdefeo/agent-skills --skill diataxis-documentation-guidance
```

**Use when:**

- Classifying a documentation topic as tutorial, how-to guide, reference, or explanation
- Splitting mixed-mode pages into focused companion docs
- Drafting or rewriting docs in an explicit Diataxis mode
- Validating doc outputs with a concrete verification checklist

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

### pr-address-feedback

Address GitHub PR review feedback end-to-end: fetch comments, propose a fix/skip/defer plan for approval, group changes into logical commits, push once, then reply to every thread with a commit hash, skip reasoning, or follow-up issue link.

**Installation:**

```
npx skills add https://github.com/robdefeo/agent-skills --skill pr-address-feedback
```

**Use when:**

- Addressing or responding to review comments on an open GitHub PR
- Triaging a mix of reviewer and bot (CodeRabbit, Copilot) comments into fix / doc-only / skip / defer
- Grouping follow-up changes into logical, conventional-commit-formatted commits
- Opening follow-up issues for out-of-scope suggestions and linking them in replies
- Resolving review threads on GitHub after they've been addressed
