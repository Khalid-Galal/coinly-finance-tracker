# Coinly — Testing Strategy

> Living document. A test pyramid — many fast unit tests, fewer integration tests, a few E2E —
> plus a domain-specific LLM-to-SQL evaluation harness (Sprint 4).

## Tooling

Vitest (unit/integration) · `@vitest/coverage-v8` · Playwright (E2E) · ESLint · Prettier ·
`tsc --noEmit` · `npm audit` — all orchestrated by GitHub Actions on every push and PR
(`.github/workflows/ci.yml`).

## Test-database isolation

Tests never touch the developer's database. `vitest.globalSetup.ts` provisions a disposable
`prisma/test.db` from the committed migrations once per run; `vitest.setup.ts` binds the Prisma
client to it before import; a guard refuses to run if `DATABASE_URL` resolves to `dev.db`. This
was hardened after an adversarial review caught that the first repository test would otherwise
have wiped real dev data.

## Coverage

Target ≥ 70% (NFR-4.1). The hard CI gate is **enabled** (US-G6): `vitest` thresholds fail the
build below 70% on lines / statements / functions / branches, scoped to the testable `lib/**`
server logic (app routes and React components are exercised by Playwright, not unit-counted).
Actual coverage is ~93% lines across ~120 tests.

## What's tested

Unit + integration tests cover the business logic across every feature:

- **Import** — CSV parsing, BOM handling, SHA-256 dedupe, the import pipeline.
- **Categorization** — rule matching, LLM batching/parsing (Gemini mocked), correction learning, fallbacks.
- **Analytics** — date-range presets, summary aggregation, monthly trend (gap-filling).
- **Budgets** — set/upsert, progress + status thresholds, month boundaries (Dec rollover).
- **Insights** — anomaly detection, the daily cost cap, weekly/monthly generation with a fallback (Gemini mocked).
- **Q&A** — the SQL allowlist (including adversarial subquery / CTE / UNION / PRAGMA bypass attempts), the LLM-to-SQL pipeline, and the eval harness.
- **Categories** — create / rename / archive / merge with data-integrity guards (merge validation, child guard, duplicate-name, re-seed).
- **Infra** — Gemini client (fetch mocked) + key rotation, exchange rates, the shared error/HTTP mapping.
- **Repositories** — account / transaction / category / rule data access.
- `/api/health` (Playwright E2E) — responds `{ ok: true }`.

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
  answered questions, so quota exhaustion can't masquerade as a pass. Measured ~94% on answered
  questions.

## Manual test plan

Accessibility (keyboard navigation, screen-reader sanity), real-bank CSV smoke tests (in a
non-CI environment with actual data), and the browser voice-input compatibility matrix.
