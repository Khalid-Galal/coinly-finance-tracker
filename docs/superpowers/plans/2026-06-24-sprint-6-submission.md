# Sprint 6 — Documentation, Demo & Submission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finalize the design & testing documents, write the methodology page, record the 15–20 min demo, and submit — clearing every line of `PRE_SUBMISSION_CHECKLIST.md` for a 5/5 on both rubrics.

**Architecture:** No new code (bug-fix only). This sprint is documentation, demonstration, and submission mechanics.

## Global Constraints
(Inherits prior globals.) Presentation rubric: demo 15–20 min, all functional capabilities shown, operates correctly throughout, professional, presenter visible/audible, government ID shown. Recording on a stable host (not WeTransfer/expiring links).

---

### Task 1: Finalize DESIGN.md (US-G7)
**Files:** `DESIGN.md`.
- [ ] Architecture diagram (Next-only layered) + the **Next-only-vs-Express decision with reasons** (rubric wants reasoned choices).
- [ ] All 7 patterns, each with *why used*: Repository, Strategy, Service Layer, Adapter, Pipeline, Guarded LLM-to-SQL, Cost-Capped client.
- [ ] **Deployment options table with cost implications** (Local / Render+Turso / Fly volume / multi-user Postgres) — the handbook explicitly asks for cost analysis + on-prem-vs-cloud recommendation.
- [ ] Commit — `docs: finalize DESIGN.md (US-G7)`

### Task 2: Finalize TESTING.md (US-G7)
**Files:** `TESTING.md`.
- [ ] Test pyramid (unit/integration/E2E), what each covers and **why that method**.
- [ ] The LLM-to-SQL evaluation methodology + a link to the latest `docs/evals/` results (the honest accuracy trail).
- [ ] Coverage summary + how CI enforces ≥70%; manual test plan (a11y, real-bank CSV smoke, browser voice matrix).
- [ ] Commit — `docs: finalize TESTING.md (US-G7)`

### Task 3: Methodology page + README final pass
**Files:** `app/about/methodology/page.tsx`, `README.md`.
- [ ] Methodology page: how categorization, insights, and Q&A work; the Gemini model used; cost tracking; AI-output labeling + disclaimer.
- [ ] README: deployed URL + **passcode for grader**, Trello link, DESIGN.md/TESTING.md links, setup/config/deploy instructions, link to demo video. Confirm `AI_USAGE.md` + `CITATIONS.md` current.
- [ ] Commit — `docs: methodology page + final README`

### Task 4: Pre-recording dress rehearsal (de-risk the live demo)
- [ ] Warm the Render instance (defeat cold start); seed realistic demo data.
- [ ] Dry-run the full demo script end-to-end on the **deployed** URL; have a text fallback ready if voice/LLM misfires.
- [ ] Walk `PRE_SUBMISSION_CHECKLIST.md` §B (Presentation) line by line.
- [ ] Confirm every link opens in an incognito window (grader can reach it).

### Task 5: Record + submit
- [ ] Record 15–20 min: summary → live demo of all capabilities (import, AI categorization, dashboard, insights, budgets, **voice Q&A**, eval accuracy) → show generated SQL once → **government ID to camera**.
- [ ] Upload to a stable host (unlisted YouTube / Drive / OneDrive).
- [ ] Submit all four links via the Quantic dashboard "Submit Project" buttons: repo, deployed app, task board, demo recording.
- [ ] Final pass over `PRE_SUBMISSION_CHECKLIST.md` — every box, both rubrics.

## Definition of Done (project)
- [ ] DESIGN.md + TESTING.md complete (patterns+reasons, cost analysis, full test story + eval trail)
- [ ] Methodology page live; README links all deliverables incl. passcode
- [ ] 15–20 min demo recorded on the live instance, ID shown, on a stable host
- [ ] All four links submitted via Quantic dashboard
- [ ] `PRE_SUBMISSION_CHECKLIST.md` fully checked — all four 5-gates green
