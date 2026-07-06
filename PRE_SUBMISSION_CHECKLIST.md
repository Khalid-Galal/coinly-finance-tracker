# Coinly — Pre-Submission Checklist (Capstone 5/5)

Mapped to the two Quantic rubrics. A **5** needs every Project-rubric line **and** every
Presentation-rubric line. Items marked ⚠️ are the highest-risk gates to the 5 (see bottom).

---

## A. Project Rubric

### A1. Software repository — *"all developed project code, appropriately documented"*
- [ ] Repo shared with the **quantic-grader** GitHub account (access confirmed, not just invited)
- [x] `README.md`: setup, configuration, env vars, local + deploy instructions (NFR-4.3)
- [x] All public functions/modules have TypeScript types + JSDoc (NFR-4.2)
- [x] No secrets committed — keys only in env vars (NFR-3.1); `.env.example` present ⚠️ *(tree is clean
  — a passcode that briefly sat in a seed-script comment was scrubbed in `0c51a0a`; `APP_PASSCODE`
  rotated on Render 2026-07-06 and verified: old value rejected 401, new value unlocks)*
- [x] `LICENSE` is MIT or Apache-2.0 (NFR-6.3)
- [x] `AI_USAGE.md` + `CITATIONS.md` present and current — **plagiarism = automatic 0**

### A2. Deployed version — *"link to the deployed version (if a Web application)"*
- [x] Live Render URL reachable from the README ⚠️ (verified 2026-07-05: `/api/health` 200, root → `/unlock`;
  SQLite persists on the Starter disk — data survives redeploys)
- [ ] Passcode gate works **and the passcode is given to the grader** (in README or submission) ⚠️
- [x] HTTPS enforced (NFR-3.3)
- [x] Always-on (Render Starter) — no cold start to warm
- [x] Seeded with realistic demo data (2026-07-05): 2 accounts + 44 transactions across 3 months +
  3 current-month budgets, via `npm run seed:demo`. Still run the **Post-deploy smoke test** (§D)
  before recording
- [x] ~~Gemini keys are NOT configured on Render~~ — added 2026-07-06; verified live: `/api/qa`
  answers correctly and `POST /api/insights` generates via gemini-2.5-flash

### A3. Task board — *"completion of **ALL** agreed user stories and tasks"* (this is the 5-vs-4 line)
- [x] Trello board public/accessible, linked from repo — [trello.com/b/hximpaKr](https://trello.com/b/hximpaKr),
  verified logged-out 2026-07-06; linked from README + TASK_BOARD
- [x] Every **committed** story (Epics A–G) sits in **Done** ⚠️ — all 37 delivered stories in sprint ✅ lists
- [x] Anything not finished was moved to a separate **v2/backlog** column *before* submission — B7/C4/F5/G3 in "v2 Backlog (deferred P3)" ⚠️
- [x] Board reflects real sprint columns (Sprint 0–6), not one dump of cards

### A4. Design & testing document — *"well-designed and well-tested, patterns + reasons, all testing + methods"*
- [x] `DESIGN.md`: architecture diagram + the 8 patterns **each with a reason** (Repository, Strategy, Service Layer, Adapter, Pipeline, Guarded LLM-to-SQL, Multi-key rotation, Cost-capped insights)
- [x] `DESIGN.md`: deployment options table **with cost implications** (handbook explicitly asks for this)
- [x] `TESTING.md`: test pyramid, what's covered, and **why** each method was chosen
- [x] LLM-to-SQL eval methodology documented in `docs/EVAL.md`; live run recorded 2026-07-05:
  **29/32 = 91%**, log committed at `docs/eval-runs/2026-07-05.log`
- [x] Coverage ≥ 70% line, shown as a CI artifact/badge (NFR-4.1) — 97.5% lines on the gated scope (2026-07-05)

### A5. Methodology + collaborative tools **incl. CI/CD**
- [x] Evidence of ≥ 3 sprints: 7 sprint plans (`docs/superpowers/plans/`) + reviews & retrospectives (`docs/SPRINTS.md`) + board sprint table
- [x] Trunk-based flow with every push to main CI-gated (see `docs/definition-of-done.md`); integration branches (`tests/group-a|b|c`) merged after their suites passed
- [ ] GitHub Actions green on main: lint, `tsc`, tests+coverage, build, Playwright E2E, `npm audit`
- [x] Automated deploy to Render on merge wired up (US-G5) — `render.yaml` autoDeploy

### A6. Initiative — *"above and beyond the minimum"* (what wins the 5 over a 4)
- [ ] LLM-to-SQL with SELECT-only allowlist guard — working **and shown** in the demo
- [ ] Weekly automated accuracy eval harness (≥30 Q&A set) with a visible accuracy trail
- [ ] Voice input (Web Speech API) working in a supported browser
- [ ] Cost-capped LLM client with graceful fallback (demonstrate the fallback at least once)
- [x] Multi-currency, plugin parser architecture, and a11y pass all present

---

## B. Presentation Rubric (scored separately — also needs a 5)
- [ ] Follow the timed script in [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md) (≈17:30, full story coverage + fallbacks)
- [ ] 15–20 minutes, timed ⚠️ (over/under drops the score; it's an explicit criterion)
- [ ] Demonstrates user stories for a **range of inputs** (not one happy path)
- [ ] App **operates correctly throughout** — rehearsed on the live deployed instance ⚠️
- [ ] Voice Q&A demoed live (your highest-impact moment) with a text fallback ready if it misfires
- [ ] Screen share clear and legible; presenter clearly visible and audible the whole time
- [ ] **Government-issued ID shown to camera**, name + photo legible
- [ ] Recording on a stable host (unlisted YouTube / Drive / OneDrive — **not** WeTransfer/expiring links)

---

## C. Submission mechanics
- [ ] All four links submitted via the Quantic dashboard "Submit Project" buttons: repo, deployed app, task board, demo recording
- [ ] Repo's README itself links to the deployed app and the task board (handbook wants these reachable from the repo)
- [ ] Every link opened in a private/incognito window to confirm it's accessible to someone who isn't you ⚠️

---

## D. Post-deploy smoke test (5 min, on the live instance)

A green Render health check only proves the process is up — `/api/health` does **not** probe the DB.
Run this by hand after any redeploy and before recording the demo, so a broken migration or empty DB
can't ambush you on camera:

1. [ ] Open the live URL in **incognito** → you land on `/unlock` (gate works).
2. [ ] Enter the passcode → redirected in; the nav and dashboard render.
3. [ ] Dashboard shows **non-zero** numbers (seed ran) — income/expense/net + category breakdown.
4. [ ] Import `docs/demo/cib-debit-credit.csv` → "Imported 12" (roughly); re-import → "skipped" (dedupe).
5. [ ] Transactions → **Auto-categorize** → rows get categories (rules + AI, or rules-only if capped).
6. [ ] Budgets page → a budget shows a progress bar + status.
7. [ ] Insights → **Generate weekly** → a report appears (AI or the deterministic fallback).
8. [ ] Ask → *"How much did I spend on Groceries last month?"* → answer + **Show generated SQL** expands.
9. [ ] Wrong passcode in a fresh incognito window → "Incorrect passcode." (gate rejects).

If any step fails, fix before recording — the Presentation rubric scores "operates correctly throughout."

## The 4 gates that decide 5 vs 4
1. ⚠️ **All committed stories Done** (A3) — or honestly re-scoped to v2 before submitting.
2. ⚠️ **Deployed link reachable + passcode supplied + warmed** (A2, C).
3. ⚠️ **Demo runs clean, 15–20 min** (B) — rehearse on the live instance, have fallbacks.
4. ⚠️ **Initiative actually shipped and shown**, not just described (A6).

Hit all four and you have a 5. Miss one and it's a strong 4.
