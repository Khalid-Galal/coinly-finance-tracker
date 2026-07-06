# Coinly — Task Board

This version-controlled file is the **canonical Scrum board** for the project (SRS §12.2).
**A story's status is flipped here in the same commit/PR that delivers it**, so this file's git
history (`git log -- TASK_BOARD.md`) is the per-commit, real-time record of board updates. A public
Trello mirror of this board is linked below. This board documents completion of
**all agreed user stories** — directly serving the Project Rubric (score 5): *"an up-to-date task
board showing completion of all agreed user stories and tasks."*

**Trello mirror:** [trello.com/b/hximpaKr](https://trello.com/b/hximpaKr) (public)

**Last updated:** 2026-07-06

**Status:** ☐ Todo · ◐ In progress · ☑ Done · ⏸ Blocked · ✂ Moved to v2
**Tiers (roadmap §4):** P0 never cut · P1 the pass · P2 wins the 5 (protect) · P3 first to v2

## Current sprint: **Sprint 6 — Submission**

| Task | Delivers | Status |
|---|---|---|
| Sprints 0–5 feature work | all P0/P1/P2 stories | ☑ |
| G7 README + design/testing docs | US-G7 | ☑ |
| Pre-submission self-audit + fixes | (quality) | ☑ |
| Live-deploy persistence verified (Render persistent disk) | US-G5 | ☑ 2026-06-28 (`2688063`, `51fd123`) |
| Demo seed script + sample CSVs + smoke checklist | (demo prep) | ☑ (`c295644`) |
| Unlock rate-limiting + fetch/POST error surfacing | (security/UX) | ☑ (`67e433d`) |
| E2E suite stabilization after group-b merge | US-G6 | ☑ (`33a9c97`) |
| Testing/deploy docs reconciled with codebase | US-G7 | ☑ (`f7c3ff9`) |
| Accessibility P1 pass + favicon | (a11y) | ☑ (`36c5081`) |
| Route-handler + gap test expansion, CI test artifacts | US-G6 | ☑ (`7c48e02`) |
| Natural, currency-formatted Q&A answers | US-F1 | ☑ (`e88aa96`) |
| Q&A relative-date resolution + seeded-data example realignment | US-F1/F6 | ☑ (`d41bbd8`) |
| Security scrub: passcode removed from seed-script usage example | (security) | ☑ (`0c51a0a`) |
| LF line-ending normalization (`.gitattributes`) | (quality) | ☑ (`1d1758b`) |
| Prettier fixes restoring green CI | (quality) | ☑ (`664f8b1`) |

## Full backlog — all agreed user stories

| ID | Story | Sprint | Pts | Tier | Status |
|----|-------|:------:|:---:|:----:|:------:|
| A1 | Prisma schema | 0 | 3 | P0 | ☑ |
| G4 | CI on every push | 0 | 5 | P0 | ☑ |
| G5 | Auto-deploy to Render | 0 | 3 | P0 | ☑ |
| A2 | Import CIB CSV | 1 | 8 | P1 | ☑ |
| A3 | Import Banque Misr CSV | 1 | 5 | P1 | ☑ |
| A4 | Import NBE CSV | 1 | 5 | P3 | ☑ |
| A5 | Duplicate detection | 1 | 3 | P1 | ☑ |
| A6 | Manual transaction entry | 1 | 5 | P1 | ☑ |
| A7 | Multiple accounts | 1 | 5 | P1 | ☑ |
| A8 | Daily exchange rates | 1 | 3 | P1 | ☑ |
| B1 | Default taxonomy | 2 | 3 | P1 | ☑ |
| B2 | Manage categories | 2 | 5 | P1 | ☑ |
| B3 | AI auto-categorize | 2 | 8 | P1 | ☑ |
| B4 | Correction learning | 2 | 5 | P1 | ☑ |
| B5 | LLM batching | 2 | 3 | P1 | ☑ |
| C1 | Summary card | 2 | 3 | P1 | ☑ |
| C2 | Category pie chart | 2 | 5 | P1 | ☑ |
| C5 | Date-range filter | 2 | 3 | P1 | ☑ |
| B6 | Rules-only fallback | 3 | 3 | P1 | ☑ |
| C3 | Monthly trend chart | 3 | 5 | P1 | ☑ |
| D1 | Weekly AI summary | 3 | 5 | P1 | ☑ |
| D2 | Monthly AI summary | 3 | 5 | P1 | ☑ |
| D3 | Anomaly flags | 3 | 5 | P1 | ☑ |
| D4 | Cost cap + tracking | 3 | 3 | P1 | ☑ |
| E1 | Set monthly budget | 3 | 3 | P1 | ☑ |
| E2 | Budget progress bars | 3 | 3 | P1 | ☑ |
| E3 | Budget warnings | 3 | 2 | P1 | ☑ |
| F1 | Natural-language Q&A | 4 | 8 | P2 | ☑ |
| F2 | SQL allowlist guard | 4 | 5 | P2 | ☑ |
| F3 | Show generated SQL | 4 | 2 | P2 | ☑ |
| F4 | Voice Q&A | 4 | 5 | P2 | ☑ |
| F6 | Q&A evaluation set | 4 | 5 | P2 | ☑ |
| G6 | ≥70% test coverage | 4 | 8 | P1 | ☑ |
| C4 | Chart drill-down | 5 | 5 | P3 | ✂ |
| C6 | Mobile responsive | 5 | 5 | P1 | ☑ |
| B7 | Accuracy report | 5 | 5 | P3 | ✂ |
| F5 | Voice quick-add | 5 | 5 | P3 | ✂ |
| G1 | First-run wizard | 5 | 5 | P1 | ☑ |
| G2 | Change base currency | 5 | 3 | P1 | ☑ |
| G3 | JSON export/import | 5 | 3 | P3 | ✂ |
| G7 | README + design doc | 6 | 5 | P1 | ☑ |

**Total: 183 pts.** ✂ Deferred to v2 (P3, ~18 pts): B7, C4, F5, G3. All P0/P1/P2 stories
delivered; A4 (NBE) was in the cut set but shipped via the shared debit/credit parser.

## Sprint summary

| Sprint | Pts | Status |
|---|:---:|---|
| 0 Foundation | 11 | ☑ Done (live + CI green) |
| 1 Data | 34 | ☑ Done (CIB/Banque Misr/NBE via debit-credit parser; generic fallback) |
| 2 AI + Dashboard | 35 | ☑ Done (taxonomy, AI categorize + correction learning, summary, category chart, date filter) |
| 3 Insights/Budgets | 34 | ☑ Done (trend chart, budgets, AI weekly/monthly insights + anomalies + cost cap) |
| 4 Q&A + Voice | 33 | ☑ Done (guarded LLM-to-SQL + voice + eval; ≥70% coverage gate enforced) |
| 5 Polish | 31 | ☑ Done (P1: B2, C6, G1, G2); P3 C4/B7/F5/G3 moved to v2 |
| 6 Submission | 5 | ☑ Done (docs + audit; deploy persistence verified 2026-06-28; a11y pass; test expansion + CI artifacts; Q&A answer polish; security scrub; green CI) |

## Submission logistics (not user stories — tracked in [PRE_SUBMISSION_CHECKLIST.md](PRE_SUBMISSION_CHECKLIST.md))

One delivery-logistics item remains before submission. It is not an agreed user story or sprint
task, so it lives in the pre-submission checklist rather than on this board:

- ~~Publish the Trello mirror of this board~~ — done 2026-07-06: [trello.com/b/hximpaKr](https://trello.com/b/hximpaKr).
- Record the demo video (script: [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)).

## Definition of Done (per story)
Merged to `main` behind the full CI gate (lint · format · types · tests+coverage · audit · build ·
e2e) · acceptance criteria met · docs updated · if user-facing: deployed to live instance + manual UX smoke ·
**status flipped to ☑ here (canonical) and mirrored to Trello.**
