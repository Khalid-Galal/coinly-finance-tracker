# Coinly — Task Board

Version-controlled mirror of the Trello Scrum board (SRS §12.2). **Update a story's status here in
the same PR that delivers it, and mirror to Trello.** This file is itself an accessible task board
documenting completion of **all agreed user stories** — directly serving the Project Rubric (score 5):
*"an up-to-date task board showing completion of all agreed user stories and tasks."*

**Status:** ☐ Todo · ◐ In progress · ☑ Done · ⏸ Blocked · ✂ Moved to v2
**Tiers (roadmap §4):** P0 never cut · P1 the pass · P2 wins the 5 (protect) · P3 first to v2

## Current sprint: **Sprint 0 — Foundation**

| Task | Delivers | Status |
|---|---|---|
| T1 Scaffold Next.js + tooling | (infra) | ☑ |
| T2 Prisma + schema | US-A1 | ☑ |
| T3 Health route + passcode | (infra) | ☑ |
| T4 CI pipeline | US-G4 | ☑ |
| T5 Deploy skeleton (live on Render) | US-G5 | ☑ |
| T6 Governance docs ☑ / Trello + share (you) | (infra) | ◐ |

## Full backlog — all agreed user stories

| ID | Story | Sprint | Pts | Tier | Status |
|----|-------|:------:|:---:|:----:|:------:|
| A1 | Prisma schema | 0 | 3 | P0 | ☑ |
| G4 | CI on every push | 0 | 5 | P0 | ☑ |
| G5 | Auto-deploy to Render | 0 | 3 | P0 | ☑ |
| A2 | Import CIB CSV | 1 | 8 | P1 | ☐ |
| A3 | Import Banque Misr CSV | 1 | 5 | P1 | ☐ |
| A4 | Import NBE CSV | 1 | 5 | P3 | ☐ |
| A5 | Duplicate detection | 1 | 3 | P1 | ☑ |
| A6 | Manual transaction entry | 1 | 5 | P1 | ☑ |
| A7 | Multiple accounts | 1 | 5 | P1 | ☑ |
| A8 | Daily exchange rates | 1 | 3 | P1 | ☑ |
| B1 | Default taxonomy | 2 | 3 | P1 | ☐ |
| B2 | Manage categories | 2 | 5 | P1 | ☐ |
| B3 | AI auto-categorize | 2 | 8 | P1 | ☐ |
| B4 | Correction learning | 2 | 5 | P1 | ☐ |
| B5 | LLM batching | 2 | 3 | P1 | ☐ |
| C1 | Summary card | 2 | 3 | P1 | ☑ |
| C2 | Category pie chart | 2 | 5 | P1 | ☐ |
| C5 | Date-range filter | 2 | 3 | P1 | ☑ |
| B6 | Rules-only fallback | 3 | 3 | P1 | ☐ |
| C3 | Monthly trend chart | 3 | 5 | P1 | ☐ |
| D1 | Weekly AI summary | 3 | 5 | P1 | ☐ |
| D2 | Monthly AI summary | 3 | 5 | P1 | ☐ |
| D3 | Anomaly flags | 3 | 5 | P1 | ☐ |
| D4 | Cost cap + tracking | 3 | 3 | P1 | ☐ |
| E1 | Set monthly budget | 3 | 3 | P1 | ☐ |
| E2 | Budget progress bars | 3 | 3 | P1 | ☐ |
| E3 | Budget warnings | 3 | 2 | P1 | ☐ |
| F1 | Natural-language Q&A | 4 | 8 | P2 | ☐ |
| F2 | SQL allowlist guard | 4 | 5 | P2 | ☐ |
| F3 | Show generated SQL | 4 | 2 | P2 | ☐ |
| F4 | Voice Q&A | 4 | 5 | P2 | ☐ |
| F6 | Q&A evaluation set | 4 | 5 | P2 | ☐ |
| G6 | ≥70% test coverage | 4 | 8 | P1 | ☐ |
| C4 | Chart drill-down | 5 | 5 | P3 | ☐ |
| C6 | Mobile responsive | 5 | 5 | P1 | ☐ |
| B7 | Accuracy report | 5 | 5 | P3 | ☐ |
| F5 | Voice quick-add | 5 | 5 | P3 | ☐ |
| G1 | First-run wizard | 5 | 5 | P1 | ☐ |
| G2 | Change base currency | 5 | 3 | P1 | ☐ |
| G3 | JSON export/import | 5 | 3 | P3 | ☐ |
| G7 | README + design doc | 6 | 5 | P1 | ☐ |

**Total: 183 pts.** v2 cut set if behind (~23 pts): A4, B7, C4, F5, G3 (never cut P2; C6 is required).

## Sprint summary

| Sprint | Pts | Status |
|---|:---:|---|
| 0 Foundation | 11 | ☑ Done (live + CI green) |
| 1 Data | 34 | ◐ In progress (A3/A4 need CSV samples) |
| 2 AI + Dashboard | 35 | ☐ |
| 3 Insights/Budgets | 34 | ☐ |
| 4 Q&A + Voice | 33 | ☐ |
| 5 Polish | 31 | ☐ |
| 6 Submission | 5 | ☐ |

## Definition of Done (per story)
Merged via reviewed PR · unit+integration tests pass in CI · lint/format/types pass · acceptance
criteria met · docs updated · if user-facing: deployed to live instance + manual UX smoke ·
**status flipped to ☑ here and on Trello.**
