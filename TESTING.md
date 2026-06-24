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

Target ≥ 70% line coverage (NFR-4.1). The hard CI gate is enabled in Sprint 4 (US-G6), once
enough surface is under test; until then coverage is reported, not gated, to avoid blocking the
early walking-skeleton sprints.

## Covered now (Sprint 0)

- `checkPasscode` (unit) — match / mismatch / unconfigured.
- `accountRepository` (integration) — create + list, archived exclusion.
- `/api/health` (Playwright E2E) — responds `{ ok: true }`.

## LLM-to-SQL evaluation harness (Sprint 4)

≥ 30 hand-written questions with known answers against a fixture database, run weekly in CI.
Metrics: exact-match, tolerance-match (floats), SQL syntactic validity, allowlist pass rate, and
end-to-end success. Dated results committed to `docs/evals/` as an honest accuracy trail.

## Manual test plan

Accessibility (keyboard navigation, screen-reader sanity), real-bank CSV smoke tests (in a
non-CI environment with actual data), and the browser voice-input compatibility matrix.
