# scratchpad — evals

Behavioral evals for the `scratchpad` skill (`skills/scratchpad/SKILL.md`).

These are **definitions only** — version-controlled and re-runnable. Run outputs
(per-run repos, transcripts, benchmark, logs) go under `runs/` and are gitignored.

## Layout

```
evals/scratchpad/
├── evals.json          # behavior test cases (prompts + assertions)
├── trigger-eval.json   # should-trigger / should-not-trigger queries for description optimization
├── fixtures/           # starting repos each test case runs against
│   ├── cold-start/         # eval 0: no SCRATCHPAD.md yet
│   ├── auto-capture/       # eval 1: CLAUDE.md pointer + code with an out-of-scope issue
│   └── retrieve-promote/   # eval 2: pre-populated SCRATCHPAD.md
└── grade.py            # programmatic grader → writes grading.json per run
```

## Running the behavior evals

1. **Scaffold** a working git repo per eval × config under `runs/iteration-N/`, copying
   the matching `fixtures/<name>/` and `git init`-ing each.
2. **Run** each case twice — once with the skill (point the agent at
   `skills/scratchpad/SKILL.md`), once baseline (no skill) — saving artifacts to
   `runs/iteration-N/<eval>/<config>/outputs/`.
3. **Grade**: `python evals/scratchpad/grade.py runs/iteration-N`
4. **Aggregate** with skill-creator's `aggregate_benchmark`, then review with
   `eval-viewer/generate_review.py`.

Iteration 1 result (with-skill vs no-skill baseline): **100% vs 44%** pass rate.

## Running the description (trigger) optimization

```
python -m scripts.run_loop \
  --eval-set evals/scratchpad/trigger-eval.json \
  --skill-path skills/scratchpad \
  --model <session-model-id> \
  --max-iterations 5 --verbose
```

Finding: **100% precision** (no false triggers on memory / PARA / direct-issue
near-misses); recall is naturally limited because lightweight capture phrasings
under-trigger by design — which is why the skill relies on the `CLAUDE.md` pointer
for auto-capture, not description-matching alone.
