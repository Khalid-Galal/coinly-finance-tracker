# Coinly

Self-hosted personal finance tracker with AI categorization, insights, and voice Q&A.
MSSE Capstone project — Quantic School of Business and Technology.

## Links

- **Live demo:** _TBD — deployed in Sprint 0 Task 5 (Render + Turso)._ Passcode-gated; the passcode is provided to the grader.
- **Task board:** [`TASK_BOARD.md`](./TASK_BOARD.md) — version-controlled mirror of the Trello Scrum board. _Trello link: TBD._
- **Design & testing:** [`DESIGN.md`](./DESIGN.md) · [`TESTING.md`](./TESTING.md)
- **AI assistance disclosure:** [`AI_USAGE.md`](./AI_USAGE.md)

## Tech stack

Next.js 16 (App Router, full-stack) · React 19 · TypeScript (strict) · Prisma — SQLite (local) / Turso libSQL (deployed) · Vitest + Playwright · ESLint 9 + Prettier · GitHub Actions · Google Gemini (AI features).

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
| `npm run test:coverage` | Vitest with coverage |
| `npm run e2e` | Playwright end-to-end |

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
