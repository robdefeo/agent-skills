---
name: pr-address-feedback
description: "Use this skill whenever the user wants to address, respond to, work through, or handle GitHub PR review comments — including code review feedback, reviewer suggestions, bot comments, or requested changes — even if they don't say \"address\". Handles the full end-to-end workflow: fetch threads, plan fixes, commit, push, and reply. Requires `gh` CLI."
---

# PR Address Feedback

## Workflow

1. **Fetch** unresolved review threads, general PR comments, and bot comments (filter noise).
2. **Evaluate** each comment and assign a disposition: `fix`, `doc-only`, `skip`, or `defer`.
3. **Propose plan** as a numbered table; wait for user approval. User edits by row number.
4. **Apply changes** grouped by concern (docs / tests / api / refactor / error-handling).
5. **Commit each group** with Conventional Commits; **push once** when all groups are done.
6. **Reply** to every thread, **resolve** fixed/doc/deferred threads, and **file follow-up issues** for deferred items.

---

## Step 1 — Fetch

Get PR metadata:

```bash
gh pr view --json number,title,headRefName,baseRefName,url,author
```

Fetch review threads (with resolution state, author, body, location):

```bash
gh api graphql -f query='
query($owner:String!,$repo:String!,$pr:Int!){
  repository(owner:$owner,name:$repo){
    pullRequest(number:$pr){
      reviewThreads(first:100){
        nodes{
          id isResolved isOutdated
          comments(first:50){
            nodes{ id databaseId author{login} body path line originalLine url createdAt }
          }
        }
      }
    }
  }
}' -F owner=OWNER -F repo=REPO -F pr=PR_NUMBER
```

After fetching, filter to unresolved threads only (`isResolved == false`) before evaluation. Threads with `isOutdated == true` should be flagged `[outdated]` and defaulted to `skip`.

> **Known limit:** `reviewThreads(first:100)` and `comments(first:50)` do not paginate. PRs with more than 100 threads or 50 comments per thread will be silently truncated.

Fetch general PR comments:

```bash
gh api repos/OWNER/REPO/issues/PR_NUMBER/comments
```

**Filter noise.** Drop bodies matching known boilerplate before evaluating:

- `thank you for your contribution`
- `reviewing this pull request and will post my feedback shortly`
- `not currently linked to an issue`
- Empty bodies or pure emoji reactions.

---

## Step 2 — Evaluate each comment

Assign one of four dispositions:

| Disposition | When to use |
|-------------|-------------|
| **fix** | Clear code change, low risk, in scope. |
| **doc-only** | Only comments/docstrings/README change — no logic touched. |
| **skip** | Design intent, disagreement with premise, or invalid suggestion. Always give a reason. |
| **defer** | Valid but out of scope for this PR. Will become a follow-up issue. |

Flag outdated inline comments (line no longer exists in the diff) as `[outdated]` in the Notes column; default disposition `skip` with reason "comment refers to code no longer in this diff".

---

## Step 3 — Propose plan

Present one concise table. Do not touch code yet.

| # | File:line | Author | Disposition | Notes |
|---|-----------|--------|-------------|-------|
| 1 | `src/foo.rs:42` | @alice | fix | Use `try_init()` instead of `init()` |
| 2 | `tests/bar.rs:16` | @bob | fix | Replace `/tmp` with `tempfile::tempdir()` |
| 3 | `src/foo.rs:96` | @alice | skip | Unbounded channel is intentional — must not block agent loop |
| 4 | `src/db.rs:120` | @coderabbit | defer | Add connection pooling — larger refactor, separate PR |
| 5 | `README.md:8` | @bob | doc-only | Clarify install prerequisites |

**Wait for approval.** The user edits by row number — e.g. `2 skip: flaky on CI`, `5 defer`. Update the table and re-confirm before proceeding.

---

## Step 4 — Apply changes grouped by concern

Group related changes into logical units. Canonical groups:

- `docs` — doc strings, comments, README/markdown fixes
- `tests` — test portability, coverage, cleanup
- `api` — public signature, return type, parameter changes
- `error-handling` — logging, error propagation, retry
- `refactor` — internal restructuring with no behavior change

**Do not mix unrelated concerns in a single commit.** Many small comments on the same concern → one commit. Two fixes in different concerns → two commits.

---

## Step 5 — Commit and push once

Conventional Commits: `type(scope): subject`

Capture the **full 40-character commit hash** with `git rev-parse HEAD` (not `--short`). Replies in Step 6 must use the full hash so the link stays stable even if GitHub's short-hash collision threshold shifts.

```bash
git add crates/tracer/src/lib.rs
git commit -m "docs(tracer): clarify async write and flush guarantees"
HASH_DOCS=$(git rev-parse HEAD)

git add crates/tracer/tests/
git commit -m "test(tracer): replace /tmp with tempfile::tempdir()"
HASH_TESTS=$(git rev-parse HEAD)

git add crates/tracer/src/lib.rs
git commit -m "fix(tracer): use try_init() and log on dropped send"
HASH_API=$(git rev-parse HEAD)

git push
```

Record a `comment_id → hash` map as you commit. Used in Step 6.

---

## Step 6 — Reply, resolve, file follow-ups

**Reply templates** — {hash} is always the full 40-character commit SHA captured in Step 5:

- **Fixed:** `` Fixed in {hash} — {one-line description of what changed}. ``
- **Doc-only:** `` Clarified in {hash} — {what was clarified}. ``
- **Skipped:** `Won't fix — {concise reason rooted in design intent or scope}.`
- **Deferred:** `Out of scope for this PR — tracked in {issue_url}.`

**Post replies** (inline review threads):

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments/COMMENT_ID/replies \
  -X POST --field body="Fixed in \`$HASH_API\` — switched to try_init() and added a warn! on dropped send."
```

> **Note:** `COMMENT_ID` must be the numeric REST API ID — use the `databaseId` field from the GraphQL response, not the node `id` (e.g. `PRRC_kwDO…`).

**Post replies** (general PR comments — no thread; post a new top-level comment):

```bash
gh api repos/OWNER/REPO/issues/PR_NUMBER/comments \
  -X POST --field body="Fixed in \`$HASH\` — {one-line description}."
```

**For deferred items, open a follow-up issue first**, then include the URL in the reply:

```bash
ISSUE_URL=$(gh issue create \
  --title "Add connection pooling to db layer" \
  --body "Follow-up from #PR_NUMBER (thread: COMMENT_URL).\n\nContext: reviewer flagged missing pooling in src/db.rs:120. Out of scope for the current PR — tracking here." \
  | tail -1)
```

**Resolve threads** for `fix`, `doc-only`, and `defer`. Leave `skip` threads open so the reviewer can push back.

```bash
gh api graphql -f query='
mutation($id:ID!){
  resolveReviewThread(input:{threadId:$id}){ thread{ isResolved } }
}' -F id=THREAD_ID
```

Reply to **every** evaluated thread — no comment should be left without a response.

---

## Edge cases

- **Branch out of sync with remote** → surface to user, do not auto-rebase or force-push.
- **PR has merge conflicts** → stop before Step 4, ask user how to proceed.
- **Outdated inline comments** → `[outdated]` tag in plan, default `skip`.
- **Pure bot boilerplate** → filtered in Step 1; never reach the plan table.
- **User rejects the whole plan** → no commits, no replies, no issues created.
- **Large PRs (>100 threads or >50 comments/thread)** → fetch is silently truncated; warn the user and process only what was returned. See [issue #2](https://github.com/robdefeo/agent-skills/issues/2) for full pagination support.
