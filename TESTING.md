# Coinly — Testing Strategy

> Living document. A test pyramid — many fast unit tests, fewer integration tests, a few E2E —
> plus a domain-specific LLM-to-SQL evaluation harness (Sprint 4).

## Tooling

Vitest (unit/integration) · `@vitest/coverage-v8` · Playwright (E2E) · ESLint · Prettier ·
`tsc --noEmit` · `npm audit` — all orchestrated by GitHub Actions on every push and PR
(`.github/workflows/ci.yml`).

## Test-database isolation

Tests never touch the developer's database. `vitest.globalSetup.ts` provisions a disposable
`prisma/test.db` from the committed migrations once per run; `vitest.setup.ts` forcibly rebinds
`DATABASE_URL` to that disposable `test.db` before the Prisma client is constructed (the client
is imported dynamically, after the rebind), so tests can never touch `dev.db`. This was hardened
after an adversarial review caught that the first repository test would otherwise have wiped real
dev data.

## Coverage

Target ≥ 70% (NFR-4.1). The hard CI gate is **enabled** (US-G6): `vitest` thresholds fail the
build below 70% on lines / statements / functions / branches, scoped to the testable `lib/**`
server logic (React components are exercised by Playwright, not unit-counted). Actual coverage on
that gated scope (as of 2026-07-05): 96.4% statements / 97.5% lines / 91.0% branches. CI also
uploads the coverage report (lcov + HTML) as a build artifact. The suite has grown to 359
unit/integration test cases (358 passed + 1 intentionally skipped) across 68 files, including
in-process **API route-handler tests** under `app/api/**/route.test.ts` (see below).

## What's tested

Unit + integration tests cover the business logic across every feature:

- **Import** — CSV parsing, BOM handling, SHA-256 dedupe, the import pipeline.
- **Categorization** — rule matching, LLM batching/parsing (Gemini mocked), correction learning, fallbacks.
- **Analytics** — date-range presets, summary aggregation, monthly trend (gap-filling).
- **Budgets** — set/upsert, progress + status thresholds, month boundaries (Dec rollover).
- **Insights** — anomaly detection, the daily cost cap, weekly/monthly generation with a fallback (Gemini mocked).
- **Q&A** — the SQL allowlist (including adversarial subquery / CTE / UNION / PRAGMA bypass attempts), the LLM-to-SQL pipeline, and the eval harness.
- **Categories** — create / rename / archive / merge with data-integrity guards (merge validation, child guard, duplicate-name, re-seed).
- **Infra** — Gemini client (fetch mocked) + key rotation, exchange rates, the shared error/HTTP mapping, the unlock rate limiter, and the passcode gate (`proxy.test.ts` — 8 unit tests: public routes pass through, locked pages redirect to `/unlock?next=…`, locked `/api/*` returns 401, cookie/header auth, and the production fail-closed 503 that e2e can't reach).
- **Repositories** — account / transaction / category / rule data access.
- **API route handlers** — each `app/api/*` handler is tested in-process (validation, status codes, and safe error mapping: malformed JSON → 400, FK violations → 400/404 not 500, no schema leaks).

**End-to-end (Playwright, real Chromium):** five specs / ~26 tests drive the app through the
passcode **unlock wall** on a gated server with a fresh migrated DB:

- `app.spec.ts` — the full first-run journey (wizard, manual entry, dashboard, transactions, budgets, categories, settings, Ask) + a gate-redirect/401 security test.
- `ingest.spec.ts` — CSV import round-trip, dedupe on re-import, and the debit/credit parser.
- `analyze.spec.ts` — dashboard/insights rendering, the budget lifecycle (set → over → remove), and category merge.
- `ask-config.spec.ts` — settings round-trip that persists across reload, the Ask page (with `/api/qa` stubbed), and the gate negatives (wrong passcode, `?next` redirect, open-redirect guard).
- `health.spec.ts` — the `/api/health` smoke check.

The e2e server runs `next dev` with the gate on (`APP_PASSCODE` set), so the unlock wall is
exercised the same way without the multi-minute production build. Timeouts are tuned to absorb the
dev server's compile-on-first-visit latency; failures retain a Playwright trace in CI.

## LLM-to-SQL evaluation harness (US-F6)

32 natural-language questions, each paired with a canonical **reference SQL** query (the ground
truth). A model answer scores correct when its result reproduces the reference's answer values as
a multiset — rewarding semantically-equivalent SQL regardless of column naming/order, with no
hand-computed expected numbers to drift. Full methodology in [`docs/EVAL.md`](./docs/EVAL.md).

- **In CI (deterministic, no network):** a "perfect model" that returns each reference query must
  score 32/32 — proving every reference query is allowlist-valid, executes against the views, and
  the scorer isn't vacuously passing (a deliberately-wrong model is caught).
- **Live (`npm run eval`):** runs the set against real Gemini. Rate-limit / quota failures are
  classified as infrastructure (excluded from the accuracy denominator) and the run requires ≥ 10
  answered questions, so quota exhaustion can't masquerade as a pass. Latest full run (2026-07-05): **91%** (29/32, 0 quota
  skips) — raw log committed at `docs/eval-runs/2026-07-05.log`; methodology in `docs/EVAL.md`.

## Accessibility

Concrete measures in the shell and key screens: a **skip-to-content link**, `aria-current="page"`
on the active nav item, nav link contrast raised to AA (≥ 4.5:1), a visible `:focus-visible` ring,
`role="progressbar"` with `aria-value*` on budget bars, and `role="img"` with a spoken data summary
on the dashboard trend chart. Manual pass per release: keyboard-only traversal (visible focus, the
skip link works), screen-reader landmark/label sanity (NVDA / VoiceOver), and 200% zoom.

## Manual test plan

Real-bank CSV smoke tests (in a non-CI environment with actual data) and a browser voice-input
check — the Web Speech API is Chromium/Safari-only, so the Ask page degrades to a typed fallback
where it is unsupported.
