# Coinly

[![CI](https://github.com/Khalid-Galal/coinly-finance-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Khalid-Galal/coinly-finance-tracker/actions/workflows/ci.yml)

Self-hosted personal finance tracker with AI categorization, insights, and voice Q&A.
MSSE Capstone project — Quantic School of Business and Technology.

## Features

- **Data in** — import bank CSVs in either a single signed-amount column or separate debit/credit
  columns (CIB, Banque Misr, NBE) with SHA-256 duplicate detection, manual entry, and multiple
  accounts with daily exchange rates.
- **AI categorization** — rules first, Gemini LLM fallback, learns from your corrections; only
  merchant + amount is ever sent to the model.
- **Dashboard** — income / expense / net summary, spending-by-category breakdown, a 6-month
  income-vs-expense trend, and date-range presets.
- **Budgets** — monthly per-category budgets with progress bars and approaching / over warnings.
- **AI insights** — weekly & monthly natural-language summaries and rule-based anomaly flags,
  under a daily cost cap that falls back to a deterministic report when reached.
- **Natural-language Q&A** — ask in plain language or by voice. A guarded LLM-to-SQL pipeline
  generates a read-only query, validates it against a SELECT-only allowlist, shows the SQL for
  transparency, and is measured by a 32-question evaluation harness (`npm run eval`).
- **Manage** — create / rename / archive / merge categories; set the base currency; a first-run
  setup wizard for new installs.

## Links

- **Live demo:** **https://coinly-kpdh.onrender.com** (Render Starter — always-on, no cold start; a persistent 1 GB disk mounted at `/var/data` keeps the SQLite data across redeploys). The whole app is passcode-gated: visitors land on an **unlock screen**, enter the passcode (provided to the grader), and a cookie unlocks the UI. `/api/health` stays public.
- **Task board:** [`TASK_BOARD.md`](./TASK_BOARD.md) — the canonical Scrum board; its git history is the per-commit, real-time record of how the sprints actually ran. _Public Trello mirror: link added at submission._
- **Sprint reviews & retrospectives:** [`docs/SPRINTS.md`](./docs/SPRINTS.md)
- **Design & testing:** [`DESIGN.md`](./DESIGN.md) · [`TESTING.md`](./TESTING.md)
- **Demo script:** [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md) — timed 15–20 min walkthrough for the recorded demonstration
- **AI assistance disclosure:** [`AI_USAGE.md`](./AI_USAGE.md)

## Above and beyond the brief

Evidence of initiative, in one place:

- **Guarded LLM-to-SQL** — generated SQL is parsed to an AST and rejected unless it is a single
  read-only `SELECT` over allowlisted views ([`lib/server/qa/sqlAllowlist.ts`](./lib/server/qa/sqlAllowlist.ts)).
- **Measured AI accuracy** — a 32-question live evaluation harness scores the Q&A pipeline against
  ground-truth queries ([`lib/server/qa/evalSet.ts`](./lib/server/qa/evalSet.ts), `npm run eval`,
  results in [`docs/EVAL.md`](./docs/EVAL.md)).
- **Daily AI cost cap** — LLM insight generation is capped per day and falls back to a
  deterministic non-AI report when the cap is reached
  ([`lib/server/insights/costGuard.ts`](./lib/server/insights/costGuard.ts)).
- **Gemini multi-key rotation** — quota errors rotate to the next configured API key
  ([`lib/server/infra/keyRotation.ts`](./lib/server/infra/keyRotation.ts)).
- **SHA-256 import dedupe** — re-importing the same statement skips duplicates
  ([`lib/server/import/hash.ts`](./lib/server/import/hash.ts)).
- **Multi-bank CSV parsers** — separate debit/credit (CIB, Banque Misr, NBE) and signed-amount
  formats ([`lib/server/import/parsers/`](./lib/server/import/parsers)).
- **Voice Q&A input** — speak a question, get it transcribed and answered, with a typed fallback
  ([`app/ask/AskClient.tsx`](./app/ask/AskClient.tsx)).
- **Privacy minimization** — only merchant + amount are ever sent to the LLM
  ([`lib/server/categorize/llm.ts`](./lib/server/categorize/llm.ts)).
- **CI coverage gate** — ≥ 70% enforced in CI; actual coverage is ~97% lines on the gated scope
  ([`vitest.config.ts`](./vitest.config.ts)).
- **Accessibility pass** — skip link, focus-visible styles, and aria labels across pages
  ([`app/layout.tsx`](./app/layout.tsx), [`app/globals.css`](./app/globals.css)).
- **Passcode gate** — the deployed instance is locked behind a passcode with a rate-limited unlock
  endpoint ([`proxy.ts`](./proxy.ts), [`app/api/unlock/route.ts`](./app/api/unlock/route.ts)).

## Tech stack

Next.js 16 (App Router, full-stack) · React 19 · TypeScript (strict) · Prisma + SQLite (local and deployed; Turso libSQL driver adapter wired for optional persistent cloud storage — set `TURSO_DATABASE_URL` to use it) · Vitest + Playwright · ESLint 9 + Prettier · GitHub Actions · Google Gemini (AI features).

## Local setup

```bash
npm install               # also runs `prisma generate` (postinstall)
cp .env.example .env       # local defaults work as-is
npx prisma migrate dev     # creates local SQLite dev.db
npm run dev                # http://localhost:3000
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run format` | Prettier check |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `test:watch` | Vitest (unit/integration) |
| `npm run test:coverage` | Vitest with coverage (CI gate ≥ 70%) |
| `npm run e2e` | Playwright end-to-end |
| `npm run eval` | Live LLM-to-SQL accuracy eval vs. real Gemini (needs API keys) |
| `npm run seed:demo` | Seed realistic demo data through the API (accounts + 3 months of transactions + budgets) |
| `npm run turso:schema` | Emit the full schema SQL for applying to a Turso DB (`\| turso db shell <db>`) |

### Seeding demo data

`npm run seed:demo` populates a running instance so the dashboard, budgets, insights, and Q&A
aren't empty. It seeds **through the API**, so it works against the live instance from your laptop:

```bash
# local
BASE_URL=http://localhost:3000 npm run seed:demo
# deployed (supply the passcode)
BASE_URL=https://coinly-kpdh.onrender.com APP_PASSCODE=<passcode> npm run seed:demo
```

It bails if accounts already exist (re-running would duplicate rows); pass `-- --force` to override.
Two ready-to-import sample statements live in [`docs/demo/`](./docs/demo): a debit/credit CIB-style
file and a signed-amount file — use them for the live import step of the demo.

## Project layout

```
app/             Pages + API route handlers (thin)
lib/server/      services / repositories / domain / infra (business logic)
proxy.ts         Passcode gate — redirects pages to /unlock, 401s /api/*
prisma/          schema + migrations
e2e/             Playwright specs
docs/            Planning specs & sprint plans (superpowers/)
planning/        SRS (source requirements)
```

## Architecture

Single Next.js process (no separate API server); layered modules; the deployed instance is passcode-gated; AI features degrade gracefully when the LLM is unavailable. Full rationale in [`DESIGN.md`](./DESIGN.md).

## License

MIT — see [`LICENSE`](./LICENSE).
