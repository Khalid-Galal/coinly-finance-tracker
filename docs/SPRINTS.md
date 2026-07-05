# Sprint Reviews & Retrospectives — Sprints 0–6

Coinly is a **solo capstone executed on a compressed calendar** (first commit 2026-06-24;
submission hardening through 2026-07-05). The seven sprints below were **scope boundaries with
plan → execute → review cycles, not fixed multi-week windows**. Each sprint had a written plan
([`docs/superpowers/plans/`](superpowers/plans/)), was executed to completion or explicit descope,
and was reviewed against its own Definition of Done. There were no standups or multi-person
ceremonies to report, and none are claimed here — **the git history is the execution record**, and
each section cites the commits that realized the sprint's scope. Because execution was fast, sprint
scopes interleave on the calendar: sprints 0–2 land largely on a single day, and hardening of
earlier scope continued into the sprint 6 window. Story IDs (US-xx), points, and cut decisions
mirror [`TASK_BOARD.md`](../TASK_BOARD.md).

| Sprint | Scope | Pts | Plan | Commit window |
|---|---|---|---|---|
| 0 | Foundation | 11 | [plan](superpowers/plans/2026-06-24-sprint-0-foundation.md) | 2026-06-24 (`922161f`…`2c248c8`) |
| 1 | Data foundation | 34 | [plan](superpowers/plans/2026-06-24-sprint-1-data-foundation.md) | 06-24 → 06-25 (`821b099`…`318c470`) |
| 2 | AI categorization + dashboard | 35 | [plan](superpowers/plans/2026-06-24-sprint-2-ai-categorization-dashboard.md) | 06-24 (`85c5213`…`8b17d93`) |
| 3 | Insights, budgets, anomalies | 34 | [plan](superpowers/plans/2026-06-24-sprint-3-insights-budgets.md) | 06-25 (`22d500e`…`5365c1f`) |
| 4 | Q&A, voice, eval harness | 33 | [plan](superpowers/plans/2026-06-24-sprint-4-qa-voice-eval.md) | 06-24 → 06-25 (`68a54e6`…`38a83c4`) |
| 5 | Polish + test hardening | 31 | [plan](superpowers/plans/2026-06-24-sprint-5-polish.md) | 06-25 → 07-04 (`fd87abf`…`36c5081`) |
| 6 | Submission | 5 | [plan](superpowers/plans/2026-06-24-sprint-6-submission.md) | 06-25 → 07-05 (`7f85598`…`664f8b1`) |

---

## Sprint 0 — Foundation (11 pts)

**Goal:** stand up a deployed walking skeleton — Next.js app, Prisma persistence, passcode gate,
and green CI/CD — so every later sprint ships to a live URL.

**Shipped**

- Next.js 16 + React 19 scaffold with strict TypeScript, ESLint, Prettier (`922161f`)
- Prisma schema for all SRS entities + health route + passcode foundation (US-A1) (`3e2caa1`)
- GitHub Actions CI — lint, format, typecheck, coverage-gated Vitest, audit, build, e2e (US-G4)
  (`efafd88`), fixed same-day by `700dd6b` (lockfile sync) and `b15eb46` (Node 24 to match npm 11)
- Next 16 `proxy.ts` convention replacing the deprecated `middleware.ts` (`06134fb`)
- Governance docs — Definition of Done, product-owner persona (`78d172e`)
- Render blueprint + Node pin (`ad80f34`); live URL recorded, US-G5 done (`2c248c8`)

**Cut / changed vs. plan**

- The plan targeted Next 14, a Turso deployed database, and a separate `deploy.yml` smoke workflow.
  Actual: Next 16 (current major at build time), SQLite on Render with `autoDeploy: true` in
  `render.yaml` (no separate deploy workflow), and Turso deferred — later wired as an optional
  driver adapter in sprint 6 (`301e149`).
- The plan's "every change to `main` via PR" gave way to trunk-based pushes gated by CI (see
  [`definition-of-done.md`](definition-of-done.md)).

**Review:** goal met — `/api/health` live over HTTPS and CI green on day one.

**Retrospective:** putting CI up before any feature code paid off immediately. The two CI breakages
(`700dd6b` lockfile drift, `b15eb46` Node/npm mismatch) surfaced on a two-commit codebase where the
cause was obvious, instead of days later in the middle of a feature push.

---

## Sprint 1 — Data foundation (34 pts)

**Goal:** ingest transactions from Egyptian bank CSVs and manual entry, deduplicated across
multiple accounts, with daily currency conversion.

**Shipped**

- Import/money/repository core: parser interface, dedupe hash, minor-unit money (US-A5)
  (`821b099`)
- Import UI + API routes: CSV upload (US-A2), manual entry (US-A6), accounts (US-A7) (`37d7c60`)
- Exchange-rate client + repository with cached-rate fallback (US-A8) (`5ac339d`)
- Debit/credit CSV parser covering CIB, Banque Misr, and NBE exports (US-A3, US-A4) (`318c470`)

**Cut / moved:** nothing. US-A4 (NBE) sat in the pre-approved v2 cut list, but shipped anyway
because one shared debit/credit parser covered all three banks (noted on `TASK_BOARD.md`).

**Review:** met — re-import is duplicate-safe, conversion is unit-tested, and multi-account entry
works on the live instance.

**Retrospective:** the cut list priced stories, not abstractions. NBE was pre-approved for
descoping at 5 pts, yet once the shared debit/credit parser existed the marginal cost of the third
bank was near zero. The real unit of estimation was the parser abstraction, not the story.

---

## Sprint 2 — AI categorization + dashboard MVP (35 pts)

**Goal:** auto-categorize transactions with a rules→LLM strategy chain that learns from
corrections, and ship the first live dashboard.

**Shipped**

- Dashboard summary + date-range filter (US-C1, US-C5) (`85c5213`)
- Gemini multi-key loader + rotation client with rate-limit fail-over (`cb11bac`, `d9be156`)
- Categorization engine: default taxonomy, rules-first strategy, batched Gemini calls, rules-only
  fallback (US-B1, US-B3–B6 engine) (`185d30e`)
- Auto-categorize action wired into the app (US-B3) (`e8d67a5`)
- Dashboard category breakdown (US-C2) + inline correction UI (US-B4) (`8b17d93`)

**Cut / moved:** the manage-categories UI (US-B2) slipped out of this sprint. The engine and
taxonomy seeding shipped here; the management screens landed with the sprint 5 polish batch
(`fd87abf`).

**Review:** met except US-B2, which was delivered later (before submission).

**Retrospective:** the plan assumed a single Gemini API key; free-tier rate limits made that
unusable the same day, forcing the multi-key rotation client (`cb11bac`, `d9be156`) before
categorization could even be exercised. On free-tier LLM quotas, quota engineering is part of the
feature — not an ops concern for later.

---

## Sprint 3 — Insights, budgets, anomalies, trends (34 pts)

**Goal:** AI weekly/monthly summaries, anomaly flags, a monthly trend chart, per-category budgets,
and a hard LLM cost cap with graceful fallback.

**Shipped**

- Monthly category budgets with progress bars + warn/over states (US-E1–E3) (`22d500e`)
- Monthly income/expense trend chart on the dashboard (US-C3) (`2d5a95c`)
- AI insights: weekly/monthly summaries, anomaly flags, cost cap + tracking (US-D1–D4) (`5365c1f`)
- Rules-only fallback (US-B6) had already shipped inside the sprint 2 engine (`185d30e`)

**Cut / changed:** the planned GitHub Actions cron jobs (scheduled rate refresh + insight
generation, plan Task 7) were dropped — `.github/workflows/` contains only `ci.yml`; insights and
rates are generated on demand. Rationale: on a passcode-gated single-user demo instance, scheduled
LLM jobs would spend capped quota with nobody watching.

**Review:** all story scope met; the ops automation was consciously descoped.

**Retrospective:** dropping the scheduler was the right call, and worth generalizing: automation
needs an operator (or at least an audience). On-demand generation met every acceptance criterion at
zero standing cost.

---

## Sprint 4 — Q&A, voice, evaluation harness (33 pts)

**Goal:** conversational Q&A over finances via guarded LLM-to-SQL, with voice input and an accuracy
evaluation harness — the initiative (P2) tier.

**Shipped**

- Parser-based SQL allowlist validator (US-F2), built before the pipeline it guards (`68a54e6`)
- Guarded LLM-to-SQL Q&A with the generated SQL shown to the user (US-F1, US-F3) (`6ba145d`)
- Voice Q&A over the same guarded pipeline (US-F4) (`c7707e5`)
- 32-question Q&A evaluation harness (US-F6) (`11343ec`)
- ≥70% coverage gate enforced + `ruleRepository` coverage (US-G6) (`38a83c4`)

**Cut / changed:** the plan's weekly `eval.yml` workflow was never created. Instead the
deterministic eval (a "perfect model" replaying each case's reference SQL, `evalRunner.test.ts`)
runs in CI **on every push** with no API key, and the live-model eval is a manual, quota-bound
`npm run eval`. The methodology and trade-off are documented in [`docs/EVAL.md`](EVAL.md).

**Review:** met — the differentiator tier shipped whole, with the security boundary and the
accuracy trail both test-enforced.

**Retrospective:** writing the allowlist before the LLM pipeline (`68a54e6` precedes `6ba145d`)
made security a foundation instead of a retrofit — the negative tests (non-SELECT, multi-statement,
comment smuggling, unknown tables) existed before any model-generated SQL could reach the database.

---

## Sprint 5 — Polish + test hardening (31 pts)

**Goal:** take Coinly from feature-complete to polished — mobile responsiveness, first-run wizard,
settings, accessibility — plus the deep-test campaign that hardened everything shipped so far.

**Shipped**

- Manage-categories UI: create/rename/archive/merge (US-B2, carried from sprint 2) (`fd87abf`)
- Mobile-responsive base styles + viewport (US-C6) (`009178f`)
- Configurable base currency (US-G2) (`2eb8d2b`)
- First-run wizard + empty-state onboarding (US-G1) (`8f4921f`)
- Accessibility: accessible names for placeholder-only controls (`9d39a7f`), then a full P1 a11y
  pass + favicon (`36c5081`)
- Emerald/teal design system + global nav across all pages (`9e8dd3f`)
- `TEST_PLAN.md` gap campaign in three parallel groups — ingest (`bcbb86d`, `5279653`, `143b165`),
  analyze (`364b253`, `74a34fc`, `79ec359`), ask/configure (`2c9f441`, `11a1b21`, `0067543`) —
  merged via `44dc242`, `f772023`, and `eb8d09f` (group B's merge trailed into the sprint 6
  window), with e2e stabilization (`8201f53`, `33a9c97`) and follow-up unit tests (`7c48e02`).
  Real defects fixed along the way: the `convertMinor` NaN/zero-FX hole (`0067543`), the unlock
  `//evil.com` open redirect (`11a1b21`), and graceful import error handling (`143b165`).

**Cut → v2 (~18 pts, with rationale):** all four P3 stories — chart drill-down (US-C4),
categorization accuracy report (US-B7), voice quick-add (US-F5), and JSON export/import (US-G3).
The roadmap had pre-marked this tier "first to v2"; the points went instead to the test campaign
and submission hardening the rubric actually grades. `TASK_BOARD.md` tracks all four as ✂ moved to
v2.

**Review:** met on committed scope — every P1 in the sprint shipped, and the P3 cuts were executed
exactly as the priority scheme prescribed rather than as a crisis.

**Retrospective:** the parallel test campaign's isolation was the expensive part, not the tests.
Running Playwright per group in git worktrees hit Turbopack panics on `node_modules` junctions
(worked around with a full `npm ci` per worktree), and the per-group port/DB isolation scheme was
ultimately superseded by a single shared e2e runtime (`TEST_PLAN.md` §8.2; `8201f53`, `33a9c97`).
Vitest tolerated the junctions fine — e2e infrastructure is where parallelism bites.

---

## Sprint 6 — Submission (5 pts)

**Goal:** finalize the documentation, de-risk and record the demo, and submit — bug-fix-only for
code.

**Shipped**

- README/DESIGN/TESTING/AI_USAGE finalized for submission (US-G7) (`7f85598`), later reconciled
  line-by-line against the actual codebase (`f7c3ff9`)
- Pre-submission self-audit: made the deploy functional, corrected docs, reconciled the board
  (`adaa3d0`)
- Passcode gate reworked into a cookie unlock wall + full browser e2e suite (`e22d646`,
  `b3d530a`) — the audit had shown the header-only gate left the deployed UI unusable
- Durable deployment: Render Starter plan + persistent disk for SQLite, verified across redeploys
  (`2688063`, `6f3545c`, `51fd123`); optional Turso libSQL adapter (`301e149`, `05de22d`)
- Demo assets: timed recorded-demo script (`9bd2cd4`); demo seed script, sample CSVs, coverage
  artifact, smoke checklist (`c295644`)
- Submission-window fixes: surfaced fetch/POST failures, unlock rate limiting, re-setup guard
  (`67e433d`); natural currency-formatted Q&A answers + relative-date resolution (`e88aa96`,
  `d41bbd8`); live passcode removed from a seed-script example (`0c51a0a`); LF endings enforced
  via `.gitattributes` (`1d1758b`); format fix (`664f8b1`)

**Cut / moved:** none in scope. The recorded demo and the public Trello link remained open user
actions at the time of writing (tracked ◐ on `TASK_BOARD.md`).

**Review:** substantially met — docs, audit, durable deploy, and demo assets are done; the final
submission mechanics (recording, board link) happen outside the repo.

**Retrospective:** the CI format gate went red late (fixed in `664f8b1`) because pushes were
batched: Prettier violations introduced on the group-B branch (`364b253`) rode into `main` with the
merge (`eb8d09f`), the local pre-push check missed them, and CI's repo-wide `prettier --check`
failure then didn't map cleanly to a single commit. Push per commit — and run the full format check
locally before every push — so a red gate points at exactly one change.
