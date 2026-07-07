# Coinly — Presentation Outline (timeline + talking points)

The high-level plan for the recorded 15–20 min demonstration. Each segment lists the time
window and the points covered. The detailed walkthrough lives in
[`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md).

| Time | Segment | Talking points |
| --- | --- | --- |
| 0:00–1:30 | Intro & identity | Name + government ID to camera · what Coinly is (self-hosted finance tracker for Egyptian banks, 3 AI features) · repo + green CI pipeline · task board: all agreed stories done, P3 items moved to v2 |
| 1:30–3:00 | Unlock & setup | Live app on Render · passcode gate (why: finance data on the public internet) · first-run wizard, base currency · multiple accounts (bank + cash) · daily exchange rates for non-base currencies |
| 3:00–5:00 | Import & dedupe | Import debit/credit CSV (CIB/Banque Misr format) · re-import same file → duplicates skipped · second format: signed-amount CSV · manual quick-add |
| 5:00–7:00 | AI categorization | Default category taxonomy out of the box · Auto-categorize: rules first (free, instant), Gemini for the rest, batched · privacy: only merchant + amount sent · correcting a category creates a rule → the app learns |
| 7:00–9:00 | Dashboard | Income/expense/net summary · spending by category · monthly trend · date-range filter updates everything · manage categories (rename/archive/safe merge) · responsive on phone width |
| 9:00–10:30 | Budgets | Monthly budget per category · progress bars · three states: on track / approaching (80%+) / over budget |
| 10:30–12:30 | AI insights | Weekly + monthly natural-language reports · anomaly flags vs usual average · daily AI cost cap with deterministic non-AI fallback (graceful degradation by design) |
| 12:30–15:30 | Q&A (highlight) | Plain-English questions, typed and by voice · answer + "Show generated SQL" transparency · security: SELECT-only allowlist over read-only views, everything else rejected · several question shapes (total, ranking, by-month) · measured: 32-question eval, 91%, log committed |
| 15:30–17:30 | Engineering & close | CI gate: lint/format/types/~360 tests/~97% lines/audit/build/Playwright e2e · Prisma schema + versioned migrations at deploy · DESIGN.md: patterns with reasons, deployment options with costs · above-and-beyond list · closing summary |

**Timing:** target ≈17:30. If running long, safe trims: category rename (segment 5) and the
third typed question (segment 8). Under 15:00 fails the rubric — slow down rather than cut.
