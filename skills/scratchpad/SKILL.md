---
name: scratchpad
description: "Capture out-of-scope discoveries, ideas, tasks, and questions into a per-repo SCRATCHPAD.md while coding, then retrieve, archive, or promote them later. Use this skill whenever the user wants to write something down to deal with later instead of now — \"park this\", \"note that\", \"jot this down\", \"add a note\", \"look at later\", \"I'll lose this otherwise\". Route these here even when it looks like a trivial inline note — the point is durable, retrievable capture, not answering in the moment. Also use it to read items back (\"what's open\", \"what did I park\", \"any notes about X\"), tick them done, archive, or promote a parked item to a GitHub issue, memory, or project. And fire it yourself when, mid-task, you hit something outside the current scope — often unexpected behavior to work around but not fix now — that would otherwise be lost. This is for TRANSIENT, project-local capture; it is NOT durable memory (facts auto-loaded every session), reminders, meeting notes, PR text, or code comments."
---

# Scratchpad

A fast-capture inbox for the things that surface *while you're doing something else*: an out-of-scope bug you noticed, an idea you don't want to act on now, a fact about the system you just learned the hard way, a question you can't answer yet. These would normally evaporate when the conversation ends. This skill parks them in a plain-markdown file in the repo so they can be found, finished, or graduated to a permanent home later.

The whole point is to be **lightweight enough that capturing never derails the real work**, and **structured enough that lookup later actually works**.

## What this is not

Be deliberate about where things land — the user runs three different systems and they don't overlap:

- **Scratchpad (this skill)** — transient, project-local, gitignored. The current repo's parking lot. Lost-if-not-captured working notes.
- **Memory** — durable facts you want loaded into context every session. A scratchpad `discovery` that proves permanently true *graduates* to memory; it doesn't start there.
- **PARA / second brain** — personal knowledge-vault organization. A scratchpad `task` that's real, tracked work *graduates* to a PARA project or a GitHub issue.

The scratchpad sits *upstream* of memory and PARA. When something outgrows the parking lot, promote it (see [Promote](#promote)). Don't capture into the scratchpad things that already belong in those systems.

---

## The store

One file per repository:

- **Location** — `SCRATCHPAD.md` at the **git repo root** (`git rev-parse --show-toplevel`). If the working directory isn't inside a git repo, fall back to the current directory. One scratchpad per repo, regardless of which subdirectory you're working in — don't scatter scratchpads through a monorepo.
- **Gitignored** — this is a personal parking lot, not a shared artifact, and it should never show up in a diff or a PR. Ensure `SCRATCHPAD.md` is ignored: if the repo has a `.gitignore` and it doesn't already cover the file, append a line for it. (If there's no git repo, skip this — there's nothing to ignore.)
- **Newest on top** — the most recent capture is the first thing you see when you open or scan the file.

### File structure

```markdown
# Scratchpad
<!-- Out-of-scope captures. Newest on top. Types: task · idea · discovery · question -->

## Active

### YYYY-MM-DD HH:MM · <type>
<title>
<optional detail body>
↳ ctx: <file:line and/or "while doing X">

## Archive

### YYYY-MM-DD HH:MM · <type>
...
```

- `# Scratchpad` (H1) with the one-line legend comment, then two H2 sections: `## Active` and `## Archive`.
- Each entry is an **H3** heading carrying its timestamp and type, so the file reads as a reverse-chronological list and every entry is greppable by type (`grep '· task'`) and date.
- The H1/H2/H3 hierarchy is load-bearing: keeping entries at H3 under the two H2 sections is what makes "everything in Archive" well-defined. If you put entries at H2, archived items become siblings of the Active section and the boundary dissolves.

### Entry format

```
### 2026-06-18 14:30 · discovery
The upstream API silently truncates payloads >1MB instead of erroring.
↳ ctx: src/client.ts:88, while wiring upload retry
```

- **Timestamp** — `YYYY-MM-DD HH:MM`. The time matters: a capture log is reverse-chronological, and date-only collides when you park several things in one day.
- **Type** — exactly one of `task` · `idea` · `discovery` · `question` (see [the bars](#the-four-types-and-their-quality-bars)).
- **Title** — one line, specific. For `task` and `question`, the title line **is a GFM checkbox** so it has a done-state:

  ```
  ### 2026-06-17 16:40 · task
  - [ ] Migrate the auth guard off deprecated `getSession()` before v3
    ↳ ctx: src/auth/guard.ts:88
  ```

  `idea` and `discovery` are write-once — they have no "done", so no checkbox.
- **Body** (optional) — a sentence or two of detail when the title isn't enough.
- **`↳ ctx:`** (optional but encouraged) — where you were and what you were doing. On lookup weeks later this is often the difference between a note you can act on and one you can't decode. Fill it automatically on silent capture — you know what the current task was.

---

## The four types and their quality bars

Every type shares one **general gate**: the item must be **out of the current task's scope** — acting on it right now would derail what you're actually doing. That's the whole reason it's being parked instead of handled.

Beyond that gate, each type has its own bar. These bars exist so capture can happen **autonomously** (you don't ask permission for every note) without the file filling with noise — and so the bar itself is **inspectable and tunable**: if the scratchpad is collecting junk or missing things, this is the section to adjust.

### task — out-of-scope work to do later

- **Qualifies:** a concrete, actionable unit of work, outside current scope, with a clear "done" state, that would otherwise be forgotten.
- **Excludes:** work already tracked (an existing TODO, issue, or PR); vague aspirations with no concrete action; the in-scope work itself.
- ✓ `Migrate the auth guard off the deprecated session API`
- ✗ `Make auth better`

### idea — improvement or suggestion

- **Qualifies:** a non-obvious, discretionary proposal to improve design, approach, tooling, or UX. No obligation to ever act on it.
- **Excludes:** trivial tweaks; ideas already raised; restatements of standard best practice.
- ✓ `Replace the polling loop with a single batched query`
- ✗ `Add comments to this file`

### discovery — something learned about the system

- **Qualifies:** a non-obvious fact about how the system *actually* behaves, learned during work, costly to rediscover, and not documented where you'd look for it.
- **Strong signal — surprise.** The moment something is *unexpected* — it contradicts your mental model, forces a change of approach, or makes you stop and work around it — that novelty is the tell that you've learned something worth keeping. Capture it even while you deal with the immediate problem; the workaround is in-scope work, but the underlying "huh, it actually does *that*" is the discovery you'd otherwise lose.
- **Excludes:** already-documented facts; expected or obvious behavior; anything trivially re-derivable.
- ✓ `The API silently truncates payloads >1MB`
- ✗ `The tests live in /tests`

### question — an open thing to investigate

- **Qualifies:** a genuine unknown surfaced during work, out of scope to resolve now, whose answer would matter later, and that has an investigatable resolution.
- **Excludes:** questions you can answer immediately; rhetorical musings; questions already tracked.
- ✓ `Does the retry logic double-charge if the webhook fires twice?`
- ✗ `Why is this code like this?`

### When an item fits more than one type

Many real captures qualify as two things at once — most often a `discovery` that also implies a `task` (you learned how something *actually* behaves, and that behavior needs fixing). Don't double-log it. Pick the single type that carries the **value**, not the obligation:

- Lead with **`discovery`** when the interesting part is understanding how the system works now. The "it should be fixed" can live in the body; if and when the fix becomes concrete, scheduled work, promote it to a `task` (or a GitHub issue) then.
- Use **`task`** only when the actionable work is the point and the underlying fact is obvious or uninteresting.

Example: "the query builds SQL by string concatenation" is both a vulnerability to fix *and* a fact about the code. Capture it as a `discovery` — the insight is what you'd lose; the fix follows from it.

The same precedence resolves the other overlaps: a `question` whose answer you'd act on is still a `question` until it's answered; an `idea` you decide to commit to becomes a `task` when you commit, not before.

When a candidate doesn't clearly clear a bar, don't capture it. A missed minor note costs little; a noisy scratchpad costs trust, and a scratchpad you don't trust is worthless.

---

## Capturing

Two paths, same destination.

### Explicit capture

The user directly asks: "park this", "note that …", "add a note", "jot this down". Capture it. If the type isn't obvious from what they said, infer it from the four definitions; only ask if it's genuinely ambiguous.

### Transparent-silent auto-capture

While working on the real task, you'll notice things that clear a bar. Capture them **without stopping to ask** — a confirmation gate mid-task is exactly the interruption this skill exists to avoid, and "should I park this?" prompts pull the user out of flow. Instead:

- **Log it silently**, then **print one inline line** so the capture is visible and vetoable:

  ```
  ↳ parked in SCRATCHPAD: Does the retry logic double-charge on duplicate webhooks?
  ```

  The user can say "drop that" and you remove it. No blocking, full visibility.
- **Flush at the end of your turn, not mid-tool-loop.** Collect capture candidates as you work and write them when you're about to hand back to the user. This keeps notices from interrupting an autonomous run, and it lets dedup (below) see the whole batch at once.
- **Dedup before writing.** Scan the existing **Active** entries and skip anything that's the same item by meaning (not just exact text) and type. The same discovery noticed three times should appear once. If a new capture refines an existing one, update the existing entry rather than adding a second.

Auto-capture depends on this skill being active in context — see [Activation](#activation). Without it, explicit capture and lookup still work fully; you just won't get the unprompted notes.

---

## Retrieving

Lookup is on-demand. When the user asks — "what's open?", "any notes about auth?", "what did I park yesterday?", "show me the ideas" — read `SCRATCHPAD.md` and answer:

- Filter by **type** (`task` / `idea` / `discovery` / `question`), **status** (open `- [ ]` vs done `- [x]`), **keyword**, or **date**, per what they asked.
- Summarize; don't just dump the file. Lead with what they asked for (e.g. open tasks first).
- The file is plain markdown — the user can also read or `grep` it directly. You don't own retrieval; you make it faster.

Recall is **per-repo**: you read the current repository's scratchpad, not others. Cross-project recall is out of scope — that's what memory and PARA are for.

---

## Lifecycle

### Marking done

When a `task` or `question` is resolved, tick its checkbox in place (`- [ ]` → `- [x]`). Nothing is deleted — the record of what you noted and closed has value. If you complete a parked task in a later session, check it off as part of that work.

### Archiving

On request — "clean up the scratchpad", "archive what's done" — move completed (`- [x]`) and clearly-stale entries from `## Active` to `## Archive`, preserving their content. This keeps the Active section scannable without losing history. Don't auto-archive; it's a deliberate, user-invoked tidy.

### Promote

When a parked item outgrows the scratchpad, graduate it to its permanent home instead of letting it rot in a parking lot:

- A durable **discovery** → a **memory** (a fact worth loading every session).
- A real **task** → a **GitHub issue** or a **PARA project**.
- An **idea** worth pursuing → wherever that work is tracked.

On "promote this":

1. Help create the item in the target system (memory file, `gh issue create`, PARA entry) as appropriate.
2. Move the scratchpad entry to `## Archive` and append a standardized pointer so the trail is traceable:

   ```
   ### 2026-06-15 11:05 · task
   - [x] Pin the flaky CI image to a digest
     ↳ promoted: issue #214
   ```
   ```
   ↳ promoted: memory `build-cache-key-stale`
   ```

Promotion keeps the scratchpad as the fast-capture *inbox* without hard-wiring it to any one downstream system.

---

## Activation

Auto-capture has a bootstrapping problem worth understanding: skills load when their description matches the user's request, but the most valuable captures happen *while working on something unrelated* — exactly when this skill wouldn't otherwise be loaded. The fix is a one-line pointer in a `CLAUDE.md`, which is always in context, telling the agent to self-load this skill when the capture bar is met.

**This skill never reads or writes `CLAUDE.md` during normal work.** Touching it on its own would mean surprise file edits and permission prompts in the middle of unrelated tasks — the opposite of staying out of the way. The pointer is installed two ways, both deliberate:

### Manual (authoritative)

The repo README documents the snippet to paste into a `CLAUDE.md`:

- `~/.claude/CLAUDE.md` (global) — auto-capture everywhere you work.
- `./CLAUDE.md` (project) — auto-capture in this repo only.

The *store* is always per-repo regardless; the snippet's location only decides *where the behavior is active*.

### Opt-in setup action

When the user explicitly asks — "set up scratchpad auto-capture" — then, and only then:

1. Ask whether they want it global (`~/.claude/CLAUDE.md`) or project (`./CLAUDE.md`).
2. Grep the chosen file for the pointer; if it's already there, say so and stop.
3. If missing, add it. A permission prompt here is expected — the user asked for this edit.

The pointer snippet:

```markdown
<!-- scratchpad-auto-capture -->
While working, capture genuinely out-of-scope discoveries, ideas, tasks, and
questions per the `scratchpad` skill (park them in SCRATCHPAD.md, print a one-line
notice). Load the skill when something clears its capture bar.
```

Without the pointer, the skill degrades gracefully: explicit "park this" and on-demand lookup work exactly the same; you simply lose the unprompted auto-capture.

---

## Edge cases

| Situation | Handling |
|---|---|
| Not inside a git repo | Use `SCRATCHPAD.md` in the current directory; skip the `.gitignore` step (nothing to ignore). |
| Working in a monorepo subdirectory | Resolve to the repo root via `git rev-parse --show-toplevel`. One scratchpad per repo — don't create a second one in the subdir. |
| `SCRATCHPAD.md` doesn't exist yet | Create it with the `# Scratchpad` header, legend comment, and empty `## Active` / `## Archive` sections, then add the entry. |
| `.gitignore` already ignores it | Do nothing — don't add a duplicate line. |
| No `.gitignore` in the repo | Create one with the `SCRATCHPAD.md` line (it's a personal file; it shouldn't be committed). |
| Candidate is borderline against a bar | Don't capture. Noise erodes trust in the file; a missed minor note is cheap. |
| Capture duplicates an existing Active entry | Skip it, or refine the existing entry — never add a near-duplicate. |
| User vetoes a just-parked item ("drop that") | Remove the entry you just wrote. |
| Type is ambiguous on explicit capture | Infer from the four definitions; ask only if genuinely unclear. |
| Asked to capture something already tracked elsewhere (open issue/PR/TODO) | It fails the bar — say so and point at the existing tracker instead of duplicating it. |
