# Coinly — Pre-Submission Checklist (Capstone 5/5)

Mapped to the two Quantic rubrics. A **5** needs every Project-rubric line **and** every
Presentation-rubric line. Items marked ⚠️ are the highest-risk gates to the 5 (see bottom).

---

## A. Project Rubric

### A1. Software repository — *"all developed project code, appropriately documented"*
- [ ] Repo shared with the **quantic-grader** GitHub account (access confirmed, not just invited)
- [ ] `README.md`: setup, configuration, env vars, local + deploy instructions (NFR-4.3)
- [ ] All public functions/modules have TypeScript types + JSDoc (NFR-4.2)
- [ ] No secrets committed — keys only in env vars (NFR-3.1); `.env.example` present
- [ ] `LICENSE` is MIT or Apache-2.0 (NFR-6.3)
- [ ] `AI_USAGE.md` + `CITATIONS.md` present and current — **plagiarism = automatic 0**

### A2. Deployed version — *"link to the deployed version (if a Web application)"*
- [ ] Live Render URL reachable from the README ⚠️ (SQLite; data resets on redeploy — warm + seed before grading)
- [ ] Passcode gate works **and the passcode is given to the grader** (in README or submission) ⚠️
- [ ] HTTPS enforced (NFR-3.3)
- [ ] Instance warmed before grading (Render free tier cold-starts → looks broken)
- [ ] Seeded with realistic demo data so the dashboard/insights aren't empty

### A3. Task board — *"completion of **ALL** agreed user stories and tasks"* (this is the 5-vs-4 line)
- [ ] Trello board public/accessible, linked from repo
- [ ] Every **committed** story (Epics A–G) sits in **Done** ⚠️
- [ ] Anything not finished was moved to a separate **v2/backlog** column *before* submission — so the agreed set reads 100% complete, not 80% of a bigger list ⚠️
- [ ] Board reflects real sprint columns (Sprint 0–5), not one dump of cards

### A4. Design & testing document — *"well-designed and well-tested, patterns + reasons, all testing + methods"*
- [ ] `DESIGN.md`: architecture diagram + the 8 patterns **each with a reason** (Repository, Strategy, Service Layer, Adapter, Pipeline, Guarded LLM-to-SQL, Multi-key rotation, Cost-capped insights)
- [ ] `DESIGN.md`: deployment options table **with cost implications** (handbook explicitly asks for this)
- [ ] `TESTING.md`: test pyramid, what's covered, and **why** each method was chosen
- [ ] LLM-to-SQL eval methodology documented in `docs/EVAL.md`; run `npm run eval` for live accuracy (set `EVAL_OUT=<path>` to write a per-question report artifact)
- [ ] Coverage ≥ 70% line, shown as a CI artifact/badge (NFR-4.1)

### A5. Methodology + collaborative tools **incl. CI/CD**
- [ ] Evidence of ≥ 3 sprints (you planned 5): planning notes, demos, retrospectives
- [ ] PRs used for every change to main (trunk-based, squash-merge) — visible in history
- [ ] GitHub Actions green on main: lint, `tsc`, tests+coverage, build, Playwright E2E, `npm audit`
- [ ] Automated deploy to Render on merge wired up (US-G5)

### A6. Initiative — *"above and beyond the minimum"* (what wins the 5 over a 4)
- [ ] LLM-to-SQL with SELECT-only allowlist guard — working **and shown** in the demo
- [ ] Weekly automated accuracy eval harness (≥30 Q&A set) with a visible accuracy trail
- [ ] Voice input (Web Speech API) working in a supported browser
- [ ] Cost-capped LLM client with graceful fallback (demonstrate the fallback at least once)
- [ ] Multi-currency, plugin parser architecture, and a11y pass all present

---

## B. Presentation Rubric (scored separately — also needs a 5)
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

## The 4 gates that decide 5 vs 4
1. ⚠️ **All committed stories Done** (A3) — or honestly re-scoped to v2 before submitting.
2. ⚠️ **Deployed link reachable + passcode supplied + warmed** (A2, C).
3. ⚠️ **Demo runs clean, 15–20 min** (B) — rehearse on the live instance, have fallbacks.
4. ⚠️ **Initiative actually shipped and shown**, not just described (A6).

Hit all four and you have a 5. Miss one and it's a strong 4.
