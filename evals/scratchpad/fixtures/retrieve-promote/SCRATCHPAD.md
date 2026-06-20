# Scratchpad
<!-- Out-of-scope captures. Newest on top. Types: task · idea · discovery · question -->

## Active

### 2026-06-18 14:30 · question
- [ ] Does the retry middleware double-charge if Stripe's webhook fires twice?
  ↳ ctx: src/payments/retry.ts:42, while fixing the timeout bug

### 2026-06-18 09:12 · discovery
Staging DB silently no-ops inserts where `tenant_id` is null.
↳ ctx: while seeding test data

### 2026-06-17 16:40 · task
- [ ] Migrate the auth guard off deprecated `getSession()` before v3
  ↳ ctx: src/auth/guard.ts:88

### 2026-06-16 11:20 · task
- [ ] Pin the flaky CI image to a digest — builds randomly fail on the latest tag
  ↳ ctx: .github/workflows/ci.yml

### 2026-06-15 10:05 · idea
Replace the per-request config reload with a cached singleton + file watcher.
↳ ctx: src/config/loader.ts

## Archive

### 2026-06-14 09:00 · task
- [x] Add a regression test for the >1MB truncation case
