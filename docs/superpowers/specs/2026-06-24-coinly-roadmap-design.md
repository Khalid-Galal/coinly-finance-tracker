# Coinly — Project Execution Roadmap (Design Spec)

**Date:** 2026-06-24
**Status:** Approved shape, detailing all sprint plans this pass
**Master design:** `Coinly_SRS_and_Planning.pdf` (v1.0) — this roadmap is the execution layer on top of it
**Rubric source:** Quantic MSSE Capstone Handbook (Project Rubric + Presentation Rubric)
**Companion:** `PRE_SUBMISSION_CHECKLIST.md` (the 5/5 gates)

---

## 1. Purpose

Turn the SRS into an executable, sprint-by-sprint build plan that lands a **5/5** on both
Capstone rubrics. The SRS already settles *what* Coinly is and *which* technologies; this
document settles *sequencing, scope-protection, and per-sprint Definition of Done*, and feeds
the writing-plans skill that details each sprint.

## 2. Architecture Decisions (two deviations from SRS)

**Next.js 16 (App Router) + React 19, full-stack, single process.** The standalone Express tier from SRS
§5.1–5.2 is removed — Next route handlers (`app/api/*/route.ts`) plus server actions already
provide the REST API, so a second framework only adds a process, a deploy target, and a second
copy of the passcode/validation middleware.

The SRS layered architecture and all 7 patterns are preserved as plain modules:

| Layer (SRS) | Lives in (Next-only) |
|---|---|
| Presentation | `app/` pages + components (shadcn/ui, Recharts) |
| API | `app/api/*/route.ts` (thin) + `middleware.ts` (passcode gate, one place) |
| Application | `lib/server/services/` (import, categorize, insights, qa) |
| Domain | `lib/server/domain/` (pure entities + rules — trivially unit-testable) |
| Infrastructure | `lib/server/repositories/` (Prisma) + `lib/server/infra/` (Gemini, rates, SQL allowlist) |

Scheduled jobs (rate refresh, weekly/monthly insights, eval, smoke) → **GitHub Actions cron**,
not a server.

> **SRS §5 edit required:** record the rationale — *"Collapsed the separate Express tier; Next.js
> route handlers already serve the REST API, removing a redundant process and deploy target."*
> A documented, reasoned architecture change is rubric-positive.

> **Deviation 2 — framework version:** SRS specified Next 14; building on **Next 16 + React 19**
> (current supported line). Next 14 is EOL with unpatched high-severity advisories whose only fix
> is this major bump — done now while greenfield (near-zero cost). Verified `npm audit` = 0 vulns.
> Plans below name Next 14 APIs; Next 16 equivalents apply (e.g., `cookies()`/`headers()`/`params`
> are now async).

## 3. Decomposition Model

```
SRS (master design)
  └─ this roadmap (sequencing + scope protection)
       └─ per-sprint plan  ×8   (docs/superpowers/plans/sprint-N-*.md)  ← writing-plans details these
            └─ Trello cards (US-XX) ← day-to-day execution
```

- Per-sprint plans: `docs/superpowers/plans/sprint-0-foundation.md` … `sprint-6-submission.md`
- Each plan: task breakdown, file targets, tests (TDD), acceptance criteria, demo script, DoD check
- Generated **all in this pass** per request (vs. just-in-time).

## 4. Velocity Reality Check (the #1 risk, quantified)

The SRS backlog totals **183 story points**. Over 5 sprints that is **~37/sprint** — above the
SRS's own stated velocity of **25–30/sprint**. The SRS sprint assignments are also unbalanced
(Sprint 1≈34, Sprint 2≈43, Sprint 3≈44, Sprint 4≈38, Sprint 5≈16).

**Implication:** delivering 100% of the backlog in 5 sprints requires sustained ~33 pts/sprint
*after* moving setup into Sprint 0 — realistic only if the day-job risk doesn't bite. So this
roadmap does two things:

1. **Rebalances** sprints to ~31–35 pts each (below).
2. Defines an explicit **MVP cut line** so that, if behind, you move pre-agreed P3 items to a
   **v2 backlog** — keeping the *committed* board 100% Done (protects the "ALL agreed stories"
   gate that separates a 5 from a 4).

### Priority spine

| Tier | What | Rule |
|---|---|---|
| **P0** | Deployed walking skeleton + green CI/CD (Sprint 0) | Never cut |
| **P1** | Import, categorize, dashboard, insights, budgets (S1–S3) | The pass (score 3) |
| **P2** | LLM-to-SQL + allowlist, eval harness, voice (S4) | **Protect — wins the 5** |
| **P3** | Mobile, wizard, export, drill-down, accuracy report, voice quick-add (S5) | First to slip → v2 |

**Pre-designated v2 cut set (~23 pts) if behind:** A4 NBE parser (5), B7 accuracy report (5),
C4 chart drill-down (5), F5 voice quick-add (5), G3 JSON export/import (3). Cutting these brings
the plan to ~30/sprint. **C6 mobile is NOT cuttable** (responsive is an SRS requirement and
demo point). Never cut P2.

## 5. Sprint Roadmap (rebalanced)

Deploy + CI moved to **Sprint 0** (SRS deferred them to Sprint 2 — too late; deploying a walking
skeleton in week 1 means every later sprint ships to a live URL and de-risks the live-demo gate).

| Sprint | Wks | Pts | Goal | Stories |
|---|---|---|---|---|
| **0 Foundation** | 1 | ~11 | Repo, Trello, scaffold, **deployed skeleton + green CI/CD** | A1, G4, G5 |
| **1 Data** | 2–3 | 34 | Full data foundation: CSV import (3 banks), manual entry, accounts, dedup, rates | A2, A3, A4, A5, A6, A7, A8 |
| **2 AI + Dashboard** | 4–5 | 35 | AI categorization end-to-end; dashboard MVP live | B1, B2, B3, B4, B5, C1, C2, C5 |
| **3 Insights/Budgets** | 6–7 | 34 | Weekly/monthly insights, anomalies, trends, budgets, cost cap | B6, C3, D1, D2, D3, D4, E1, E2, E3 |
| **4 Q&A + Voice** | 8–9 | 33 | LLM-to-SQL + allowlist + voice + **eval harness** (the 5-winner) | F1, F2, F3, F4, F6, G6 |
| **5 Polish** | 10–11 | 31 | Mobile, wizard, settings, export, drill-down, accuracy report, voice quick-add, a11y, perf | C4, C6, B7, F5, G1, G2, G3 |
| **6 Submission** | 12–14 | ~5 | Docs finalized, methodology page, demo recorded, submitted | G7 |

## 6. Cross-cutting tracks (every sprint, not a phase)

- CI stays green; PR-per-change (even solo) to exercise CI; squash-merge, linear history
- Trello updated in real time; WIP limit 2
- Coverage ≥70% held continuously (CI gate), not back-loaded
- `DESIGN.md` + `TESTING.md` grown each sprint (a pattern/decision when made, a test when written) — never written in week 13
- `AI_USAGE.md` + `CITATIONS.md` kept current (plagiarism = 0)
- Deployed instance kept warm + passcode handy for grader

## 7. Rubric 5/5 traceability

| Rubric line (Project) | Delivered by |
|---|---|
| Repo, documented code | S0 setup + every sprint (JSDoc/types as written) + G7 |
| Deployed link (web app) | **S0** (skeleton) → kept live every sprint |
| Task board, ALL agreed stories Done | Trello, every sprint; §4 cut-line keeps "agreed" honest |
| Design & testing doc (patterns + reasons, all tests) | §6 incremental → finalized G7 |
| Methodology + CI/CD | S0 CI/CD + Scrum ceremonies all sprints |
| **Initiative (above & beyond)** | **S4**: LLM-to-SQL allowlist guard + eval harness + voice; plus multi-currency, cost-cap, plugin parsers, a11y |
| Outstanding demo (Presentation rubric) | S6 record; rehearsed on live instance; 15–20 min |

## 8. Risks (ref SRS §8, plus this roadmap's additions)

- **Backlog > velocity (§4)** — new, quantified here. Mitigation: rebalance + v2 cut line.
- Day-job compresses time (SRS top risk, score 20) — mitigation: priority spine, protect P2.
- Live demo / deploy fails on camera — mitigation: deploy in S0, keep warm, rehearse, fallbacks.
- LLM-to-SQL incorrect — mitigation: allowlist + eval harness with measured accuracy.

## 9. Definition of Done (per story — from SRS §11.1, adapted to Next-only)

Code merged via reviewed PR · unit+integration tests passing in CI · lint/format/types pass ·
acceptance criteria met · docs updated · if user-facing: deployed to live instance + manual UX
smoke.

## 10. Next step

Invoke **writing-plans** to detail all eight sprint plans into
`docs/superpowers/plans/`, each TDD-structured against the stories above.

> **Git note:** repo is not yet initialized — repo creation + share-with-quantic-grader is the
> first task of Sprint 0. This spec and the plans are written to disk now; committing them is
> folded into Sprint 0 so the repo is set up the way the grader needs (not pre-created ad hoc).
