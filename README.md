# Coinly

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

- **Live demo:** **https://coinly-kpdh.onrender.com** (Render free tier — sleeps when idle, first request cold-starts; storage is ephemeral, so data resets on redeploy). `/api/*` is passcode-gated (`x-passcode` header); the passcode is provided to the grader. The home page and `/api/health` are public.
- **Task board:** [`TASK_BOARD.md`](./TASK_BOARD.md) — version-controlled mirror of the Trello Scrum board. _Trello link: TBD._
- **Design & testing:** [`DESIGN.md`](./DESIGN.md) · [`TESTING.md`](./TESTING.md)
- **AI assistance disclosure:** [`AI_USAGE.md`](./AI_USAGE.md)

## Tech stack

Next.js 16 (App Router, full-stack) · React 19 · TypeScript (strict) · Prisma + SQLite (local and deployed; Turso libSQL is an optional persistence upgrade, not yet wired) · Vitest + Playwright · ESLint 9 + Prettier · GitHub Actions · Google Gemini (AI features).

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

## Project layout

```
app/             Pages + API route handlers (thin)
lib/server/      services / repositories / domain / infra (business logic)
proxy.ts         Passcode gate for /api/*
prisma/          schema + migrations
e2e/             Playwright specs
docs/            Planning specs & sprint plans (superpowers/)
planning/        SRS (source requirements)
```

## Architecture

Single Next.js process (no separate API server); layered modules; the deployed instance is passcode-gated; AI features degrade gracefully when the LLM is unavailable. Full rationale in [`DESIGN.md`](./DESIGN.md).

## License

MIT — see [`LICENSE`](./LICENSE).
