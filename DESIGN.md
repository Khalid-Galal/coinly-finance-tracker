# Coinly — Design & Architecture

> Living document, grown each sprint. The authoritative requirements are the SRS
> (`planning/Coinly_SRS_and_Planning.pdf`); the execution plan is in
> `docs/superpowers/specs/` and `docs/superpowers/plans/`.

## Architecture decisions

### 1. Next.js full-stack — no separate Express tier
**Decision:** a single Next.js 16 (App Router) process. Route handlers (`app/api/*/route.ts`)
and server actions provide the REST API.
**Reason:** the SRS first proposed a standalone Express backend. For a single-user, self-hosted
app that duplicates middleware (passcode, validation) and adds a second process and deploy
target for no capability Next does not already provide. Collapsing it lowers the live-demo and
CI failure surface. The SRS layered architecture is preserved as plain modules (below).

### 2. Next 16 + React 19 (SRS proposed Next 14)
**Decision:** build on the current supported line.
**Reason:** Next 14 is end-of-life with unpatched high-severity advisories; the only fix is a
major bump, which is near-zero cost while the project is greenfield. `npm audit` is clean (0).

### 3. Local-first persistence with cloud parity
SQLite (local) and Turso/libSQL (deployed) through Prisma — identical SQL semantics in both.
All monetary values are stored as integer **minor units** (no floating point).

## Layered structure

| Layer | Location |
| --- | --- |
| Presentation | `app/` pages + components |
| API | `app/api/*/route.ts` (thin) + `middleware.ts` (passcode gate) |
| Application | `lib/server/services/` |
| Domain | `lib/server/domain/` (pure entities + rules) |
| Infrastructure | `lib/server/repositories/` (Prisma) + `lib/server/infra/` (Gemini, rates) |

## Patterns (filled in as implemented, with reasons)

- **Repository** — data access behind a domain interface. _Implemented Sprint 0 (`accountRepository`)._
- **Strategy** — pluggable categorization (rules / LLM / hybrid). _Sprint 2._
- **Service Layer** — use-case orchestration, thin controllers. _Sprint 1+._
- **Adapter** — per-bank CSV parsers behind one interface. _Sprint 1._
- **Pipeline** — CSV import as parse → dedupe → normalize → categorize → persist. _Sprint 1._
- **Guarded LLM-to-SQL** — LLM generates SQL, validated against a SELECT-only allowlist. _Sprint 4._
- **Cost-Capped LLM client** — tracks monthly spend, short-circuits to fallbacks at the cap. _Sprint 3._

## Security

The passcode middleware gates all `/api/*` routes (`/api/health` is intentionally public for
uptime/smoke checks) and **fails closed** (503) in production if no passcode is configured.
Secrets live in environment variables only. LLM-to-SQL adds a parser-based SELECT-only allowlist
in Sprint 4. Dependencies are scanned (`npm audit`) on every CI run.

## Deployment options & cost (SRS §5.5)

| Option | Topology | Cost | Notes |
| --- | --- | --- | --- |
| Local self-host | SQLite + Node on a laptop | $0 | Max privacy; no remote access |
| **Cloud demo (recommended)** | Render web + Turso libSQL + passcode | $0 (free tiers) | Public demo URL for the grader |
| Fly.io + volume | Fly app + persistent volume + SQLite | $0–5/mo | True SQLite in the cloud |
| Multi-user production | Container + PostgreSQL + auth + WAF | $20–50/mo | Out of scope for this capstone |

## Data model

See `prisma/schema.prisma` (11 models: Account, Category, Transaction, CategorizationRule,
Budget, ExchangeRate, Insight, QaHistory, AuditLog, Setting). Money in minor units; dedupe via a
unique hash on transactions; indexes on transaction `date`, `categoryId`, `accountId`.
