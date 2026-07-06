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
major bump, which is near-zero cost while the project is greenfield. `npm audit --omit=dev
--audit-level=high` gates every CI run — clean as of Sprint 6.

### 3. Local-first persistence, durable cloud persistence
SQLite through Prisma, both locally and on the deployed instance. On Render the app runs on the
**Starter plan** (always-on, no cold start) with a **persistent 1 GB disk** mounted at `/var/data`
(`DATABASE_URL=file:/var/data/coinly.db`). Migrations run **at boot** (`prisma migrate deploy &&
next start`), not at build, because the disk only mounts at runtime — this creates the schema +
the read-only Q&A views and **data survives redeploys** (verified with a live write → redeploy →
read test). `lib/server/db.ts` also keeps the **`@prisma/adapter-libsql` driver adapter** wired as
an alternative: set `TURSO_DATABASE_URL` to run against Turso libSQL with no code change. The
persistent disk means Turso isn't needed for the current deploy, but the seam remains for a
horizontally-scaled future. All monetary values are stored as integer **minor units** (no floating
point).

**Activate Turso:** (1) `turso db create coinly` and `turso db tokens create coinly`; (2) set
`TURSO_DATABASE_URL` (the `libsql://…` URL) and `TURSO_AUTH_TOKEN` in the Render dashboard;
(3) apply the schema once with `npm run turso:schema | turso db shell coinly` — this concatenates
all migrations in order (Prisma's migration engine can't drive a `libsql://` URL directly, so the
schema is applied out-of-band while the running app talks to Turso via the adapter).

## Layered structure

The codebase is organized **feature-first** under `lib/server/` rather than by classic layer
folders — each feature module holds its own use-case orchestration and domain rules, which keeps
related code together and easy to hold in context.

| Layer | Location |
| --- | --- |
| Presentation | `app/*/page.tsx` pages + client components |
| API | `app/api/*/route.ts` (thin handlers) + `proxy.ts` (passcode gate) + `lib/server/errors.ts` (shared 400/404/500 mapping) |
| Application / domain | `lib/server/<feature>/`: `categorize`, `qa`, `insights`, `budgets`, `analytics`, `import`, `categories`, `settings`, `money` (pure money math) |
| Infrastructure | `lib/server/repositories/` (Prisma data access) · `lib/server/infra/` (Gemini client, key rotation, exchange rates) · `lib/server/db.ts` (Prisma singleton) |

## Patterns (filled in as implemented, with reasons)

- **Repository** — data access behind a domain interface (`lib/server/repositories/`). _Why:_ storage can move SQLite → Turso/Postgres without touching feature code, and repositories are trivially mockable in unit tests. _Implemented Sprint 0 (`accountRepository`)._
- **Rules-first hybrid categorization** — deterministic user rules run first; only the remainder is batched to the LLM (~1 call per 20 transactions), and LLM failure degrades to rules-only, leaving the rest uncategorized (`categorizeService.ts`). _Why:_ rules are free, instant, and predictable; the LLM covers only the long tail (cost + accuracy); and the feature never hard-fails on quota or network (availability). _Sprint 2._
- **Service Layer** — use-case orchestration in `lib/server/<feature>/`, thin controllers. _Why:_ route handlers stay ~10 lines, and orchestration is unit-testable without going through HTTP. _Sprint 1+._
- **Adapter** — CSV parsers behind one `BankStatementParser` interface, auto-selected by header sniffing: a generic single signed-amount parser and a debit/credit two-column parser (CIB, Banque Misr, NBE), with the generic one as fallback. _Why:_ adding a bank is one parser file plus a registry entry — no changes to the import service. _Sprint 1._
- **Pipeline** — CSV import as parse (parsers normalize dates/amounts to minor units) → hash → dedupe (against the DB and within the file) → persist (`lib/server/import/importService.ts`). Categorization is deliberately **not** an import stage: it is a separate user-triggered step (`POST /api/categorize`, from the transactions page). _Why:_ import stays fast and idempotent, and still works when the LLM is down. _Sprint 1._
- **Guarded LLM-to-SQL** — LLM generates SQL over read-only views, validated against a SELECT-only allowlist before execution; the SQL is surfaced to the user. _Why:_ LLM output is untrusted input — the AST allowlist makes prompt injection unable to write, delete, or read outside the views, and surfacing the SQL lets the user verify every answer instead of trusting a black box. _Sprint 4._
- **Multi-key rotation** — the Gemini client rotates across configured API keys on rate-limit / transient failure, sticking to the last good key. _Why:_ free-tier Gemini quotas are per-key and small; rotation multiplies effective quota and keeps AI features available through transient 429/5xx without user-visible failures. _Sprint 2._
- **Cost-capped AI insights** — a per-day cap on LLM insight generation (counter in the `Setting` table); at the cap it short-circuits to a deterministic, non-AI fallback so the feature still works. _Sprint 3._

### Technology choices

- **Google Gemini** (`gemini-2.5-flash`, called via the REST API — no SDK dependency) — the free-tier quota is workable for a single-user app once combined with multi-key rotation (`lib/server/infra/keyRotation.ts`) and the daily insight cost cap (`costGuard.ts`), and it reliably returns the JSON array the batched categorization prompt asks for.
- **Prisma** — typed schema and generated client, a migration engine (`prisma migrate deploy` at boot), and the driver-adapter seam (`@prisma/adapter-libsql`) that makes Turso a config change rather than a rewrite.
- **TypeScript `strict` + zod** — end-to-end static typing, with zod schemas (`lib/shared/schemas.ts`, used by the API routes) adding runtime validation at the API boundary where static types can't reach request bodies.
- **papaparse** — battle-tested CSV parsing (quoted fields, embedded delimiters/newlines, delimiter auto-detection) instead of a hand-rolled split; the import service additionally strips the UTF-8 BOM that Excel and bank exports prepend before header sniffing.

## Security

The passcode proxy (`proxy.ts`, Next 16 convention) gates the whole app when `APP_PASSCODE` is set:
unauthenticated page requests are redirected to an **unlock screen** (`/unlock`) and API requests
get 401. Entering the passcode (`POST /api/unlock`) sets an httpOnly cookie that the proxy then
accepts — so the interactive UI works even though its client-side fetches can't attach a header.
`/api/health` (and `/unlock`, `/api/unlock`) stay public; the gate **fails closed** (503) in
production if no passcode is configured. (Lightweight single-user demo gate, not full auth.)
Secrets live in environment variables only. LLM-to-SQL adds a parser-based SELECT-only allowlist
in Sprint 4. Dependencies are scanned (`npm audit`) on every CI run.

## Deployment options & cost (SRS §5.5)

| Option | Topology | Cost | Notes |
| --- | --- | --- | --- |
| On-premises (local self-host) | SQLite + Node on a laptop | $0 | Max privacy; no remote access |
| **Cloud demo (current)** | Render Starter + SQLite on a persistent disk + passcode | ~$7/mo (Starter) + disk | Public demo URL; always-on (no cold start); migrations run at boot; **data survives redeploys** |
| Cloud demo (Turso alt) | Render web + Turso libSQL + passcode | $0 (free tiers) | libSQL adapter wired (db.ts); set TURSO_* + apply schema once → data survives redeploys, no paid disk |
| Fly.io + volume | Fly app + persistent volume + SQLite | $0–5/mo | True SQLite in the cloud |
| Multi-user production | Container + PostgreSQL + auth + WAF | $20–50/mo | Out of scope for this capstone |

**Recommendation:** the Render Starter cloud deploy (~$7/mo, always-on, durable disk) for the
graded demo — a public URL with no cold start and data that survives redeploys; on-premises
self-hosting remains the $0 maximum-privacy option.

## Data model

See `prisma/schema.prisma` (10 models: Account, Category, Transaction, CategorizationRule,
Budget, ExchangeRate, Insight, QaHistory, AuditLog, Setting). Money in minor units; dedupe via a
unique hash on transactions; indexes on transaction `date`, `categoryId`, `accountId`.

Two **read-only SQLite views** (`v_transactions`, `v_category_totals`) expose a safe, denormalized
projection for the guarded Q&A — the LLM may only query these (migration
`20260625090000_qa_readonly_views`). Dates are normalized to ISO text in the views because Prisma
stores SQLite `DateTime` as epoch-milliseconds, which would otherwise mis-compare against the
string date filters an LLM naturally writes.
