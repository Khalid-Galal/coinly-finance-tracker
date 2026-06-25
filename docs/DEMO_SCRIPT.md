# Coinly — Recorded Demo Script (15–20 min)

A timed walkthrough for the Capstone **Presentation Rubric** (score 5):

- Thorough, clear demo of the user stories **for a range of inputs**
- The app **operates correctly throughout**
- Professional, legible screen share; presenter clearly visible + audible
- **15–20 minutes** long

Target run time **≈17:30** (buffer on both ends). Rehearse once on the **live** instance.

---

## Before you hit record (pre-flight)

- [ ] **Warm the live instance** — open https://coinly-kpdh.onrender.com a few minutes early so the free-tier cold start is over.
- [ ] **Set `APP_PASSCODE`** on Render and have it ready; **`GOOGLE_API_KEYS`** set so AI features work. If using Turso, confirm it's connected (else demo on SQLite and just don't redeploy mid-demo).
- [ ] **Seed a little realistic data already** (a couple of accounts + an imported CSV) so the dashboard isn't empty — but keep one CSV import and one categorize/QA action *live* for the demo.
- [ ] Have two sample CSVs on the desktop: one **debit/credit** format (CIB/Banque Misr style) and one **signed-amount** format.
- [ ] **Fallbacks ready:** if voice misfires, type the same question; if the AI cap/quota is hit, narrate the deterministic fallback as a *designed* behavior (it is).
- [ ] Screen at a readable zoom; close noisy tabs; webcam + mic checked; quiet room.
- [ ] Recording on a **stable host** (unlisted YouTube / Drive / OneDrive — not an expiring link).

---

## Script

### 0 · Intro & identity — 0:00–1:30
- **Show government ID to camera** (name + photo legible), say your name and that this is the MSSE Capstone.
- One-line pitch: *"Coinly is a self-hosted personal-finance tracker for Egyptian banks, with AI categorization, AI insights, and a natural-language + voice Q&A over your data."*
- Flash the **repo** (green CI badge / Actions tab) and the **TASK_BOARD** — *"all agreed user stories done, P3 explicitly moved to v2."* Mention the stack in one breath: Next.js 16 + Prisma + Gemini, ~126 tests, 93% coverage gated in CI.

### 1 · First-run wizard & accounts (US-G1, G2, A7) — 1:30–3:00
- Open the app → **first-run wizard** (`/welcome`): set **base currency** (US-G2), create the first **account**.
- Add a **second account** of a different type (bank + cash) → **US-A7 multiple accounts**.
- *Range of inputs:* two account types, a currency choice.

### 2 · Import + duplicate detection (US-A2/A3/A4, A5, A6) — 3:00–5:00
- Import the **debit/credit CSV** (CIB/Banque Misr/NBE format) → show "Imported N".
- **Re-import the same file** → "Imported 0, skipped N" → **US-A5 dedupe** (call it out explicitly).
- Import the **signed-amount CSV** → show the generic parser handles a different shape too.
- Add one transaction by hand via **Quick add** (US-A6).
- *Range of inputs:* two CSV formats + manual entry + the dedupe path.

### 3 · AI categorization + learning (US-B3, B4, B5, B6) — 5:00–7:00
- On Transactions, click **Auto-categorize** → rows get categories (rules-first, Gemini for the rest).
- **Correct one** category inline → explain it **creates a rule and learns** (US-B4), so similar merchants categorize correctly next time.
- Note the **privacy stance:** only merchant + amount go to the model, never full transaction data.
- *Range of inputs:* varied merchants; a correction.

### 4 · Dashboard analytics (US-C1, C2, C5, C3, B2) — 7:00–9:00
- **Summary card** (income/expense/net in your base currency), **spending-by-category** breakdown, **6-month trend** chart.
- Switch **date-range presets** (this-month / last-3-months) → numbers update (US-C5).
- Quick hop to **Manage categories** → rename one, **merge** two → explain merge repoints transactions/rules/budgets safely (mention it was hardened by an adversarial review that caught a data-loss bug).

### 5 · Budgets (US-E1, E2, E3) — 9:00–10:30
- Set a **monthly budget** for a category → **progress bar**.
- Set a deliberately **low budget** on a high-spend category → show the **"over budget"** red warning; and one in the 80–99% band → **"approaching limit."**
- *Range of inputs:* on-track vs approaching vs over.

### 6 · AI insights + cost cap (US-D1, D2, D3, D4) — 10:30–12:30
- **Generate weekly** and **monthly** summaries → read the natural-language insight.
- Point out **spending alerts / anomaly flags** (US-D3) — a category above its trailing average.
- **Show the cost cap (US-D4):** the usage meter, and — if you pre-set `INSIGHT_DAILY_LLM_CAP` low — generate once more to show it **falls back to a deterministic non-AI report**. Frame it as *designed graceful degradation*, which also keeps the demo running if quota is exhausted.

### 7 · Natural-language + voice Q&A — the headline (US-F1, F2, F3, F4, F6) — 12:30–15:30
- Ask a typed question: *"How much did I spend on Dining last month?"* → answer + result table + **expand "Show generated SQL"** (US-F3 transparency).
- Ask **two more shapes** for range: a **top-N** ("my 5 biggest expenses") and a **by-month** ("how much did I earn in March"). 
- Explain the **guard (US-F2):** the LLM only writes a single read-only SELECT over allowlisted views, validated before execution — *"it can't be tricked into writing or reading anything else."*
- **Voice (US-F4):** tap 🎤, speak a question, let it transcribe → answer read back. *If it misfires, immediately type the same question (fallback) and keep moving.*
- Mention the **evaluation harness (US-F6):** 32 questions, measured ~94% accuracy — *"we don't just claim it works, we measure it."*

### 8 · Engineering quality & close — 15:30–17:30
- Briefly show: **GitHub Actions green** (lint/format/types/coverage-gate/build/e2e/audit), the **coverage gate** (~93%), and `docs/EVAL.md` / `DESIGN.md` (8 patterns with reasons, security: passcode gate, money as integer minor units).
- One sentence of **initiative**: guarded LLM-to-SQL + voice + a measured eval + cost-capped AI with fallback + multi-key rotation + an adversarial-review pass that caught a real bug.
- Close: thank you, name again, repo + live + board links are in the submission.

---

## Story coverage map (so nothing is missed)

| Segment | User stories shown |
|---|---|
| 1 | G1, G2, A7 |
| 2 | A2, A3, A4, A5, A6 |
| 3 | B3, B4, B5, B6 |
| 4 | C1, C2, C5, C3, B2 |
| 5 | E1, E2, E3 |
| 6 | D1, D2, D3, D4 |
| 7 | F1, F2, F3, F4, F6 |
| 8 | G4 (CI), G5 (deploy), G6 (coverage), G7 (docs) |

Every committed story appears. If you run long, the safe trims are segment 4's category-merge aside and one of the segment-7 extra question shapes.
