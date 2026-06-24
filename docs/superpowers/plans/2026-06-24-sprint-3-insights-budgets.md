# Sprint 3 — Insights, Budgets, Anomalies, Trends Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Coinly genuinely useful — AI weekly/monthly summaries, anomaly flags, monthly trend chart, per-category budgets, and a hard LLM cost cap with graceful fallback.

**Architecture:** Cost-Capped LLM client wraps the Gemini client (tracks monthly spend, short-circuits to templates at the cap). Anomaly detection is a pure statistical module. Insights cached in the `insights` table. Scheduled generation via GitHub Actions cron.

**Tech Stack:** (carried). Adds GitHub Actions scheduled workflows.

## Global Constraints
(Inherits prior globals.) FR-4.6: default cost cap $5/month, configurable. FR-4.5: cache summaries to avoid duplicate LLM calls. FR-4.4/NFR-6.2: every AI summary tagged + dated + visually labeled as AI-generated. NFR-6.1: analytical views carry the "not financial advice" disclaimer.

---

### Task 1: Cost-capped LLM client (US-D4) — initiative pattern

**Files:** `lib/server/infra/costCappedClient.ts`, `lib/server/repositories/llmSpendRepository.ts`. **Test:** `costCappedClient.test.ts`.

**Interfaces:** `costCappedClient.call(fn, estCostUsd)` → runs `fn` if `monthSpend + estCost ≤ cap`, else throws `CapExceededError`; `monthSpendUsd()`.

- [ ] **Failing test:** under cap, the wrapped fn runs and spend accrues; at/over cap, it throws `CapExceededError` and the fn is **not** called.

```typescript
// costCappedClient.test.ts (shape)
it("blocks calls once the monthly cap is reached", async () => {
  const client = makeClient({ capUsd: 0.10, monthSpendUsd: async () => 0.10 });
  const fn = vi.fn();
  await expect(client.call(fn, 0.01)).rejects.toBeInstanceOf(CapExceededError);
  expect(fn).not.toHaveBeenCalled();
});
```
- [ ] Implement → pass. Route the Gemini client (Sprint 2) through this wrapper. Commit — `feat: cost-capped LLM client (US-D4)`

---

### Task 2: Rules-only fallback mode (US-B6)

**Files:** modify `categorizeService.ts`. **Test:** extend `categorizeService.test.ts`.

- [ ] **Failing test:** when `costCappedClient` throws `CapExceededError` (or Gemini is down), categorization runs rules-only and marks the remainder `"Uncategorized"` — never throws (FR-2.8).
- [ ] Implement fallback path → pass. Commit — `feat: rules-only categorization fallback (US-B6)`

---

### Task 3: Anomaly detection (US-D3) — pure stats

**Files:** `lib/server/insights/anomaly.ts`. **Test:** `anomaly.test.ts`.

**Interfaces:** `findAnomalies(txs, opts?): {txId, score, method}[]` — z-score on the per-category historical distribution (fallback to IQR when n is small).

- [ ] **Failing test:**

```typescript
// anomaly.test.ts
import { findAnomalies } from "./anomaly";
it("flags a value far from the category mean", () => {
  const txs = [10,12,11,13,9,500].map((v,i)=>({ txId:`t${i}`, categoryId:"dining", amountMinor:v*100 }));
  const out = findAnomalies(txs);
  expect(out.map(a=>a.txId)).toContain("t5");   // 500 is the outlier
  expect(out.map(a=>a.txId)).not.toContain("t0");
});
it("does not flag tight distributions", () => {
  const txs = [10,10,11,10,9].map((v,i)=>({txId:`t${i}`,categoryId:"x",amountMinor:v*100}));
  expect(findAnomalies(txs)).toHaveLength(0);
});
```
- [ ] Implement z-score (|z| ≥ 3 default, configurable; IQR when n<8) → pass. Surface flags in the transactions list + dashboard. Commit — `feat: anomaly detection (US-D3)`

---

### Task 4: Weekly + monthly AI insights (US-D1, US-D2)

**Files:** `lib/server/insights/insightService.ts`, `prompts/weekly-insight.v1.md`, `prompts/monthly-insight.v1.md`, `app/insights/page.tsx`. **Test:** `insightService.test.ts` (mock LLM).

**Interfaces:** `insightService.generate(type, periodStart): Promise<Insight>` — aggregates numbers (never raw transactions, §12.3) → prompts via cost-capped client → caches in `insights`.

- [ ] **Failing test:** generating the same period twice returns the cached insight with **0** extra LLM calls (FR-4.5).
- [ ] **Failing test:** at the cost cap, falls back to a deterministic template summary tagged `model:"template"` (FR-4.6).
- [ ] Implement service (prompts versioned in `prompts/`, store `model` + `generatedAt`) → pass.
- [ ] Insights feed page: chronological, each card AI-labeled + dated + helpful/unhelpful toggle (FR-4.4) + disclaimer.
- [ ] Commit — `feat: weekly + monthly AI insights with cache + template fallback (US-D1/D2)`

---

### Task 5: Monthly trend chart (US-C3)

**Files:** `lib/server/analytics/trend.ts`, `app/dashboard/TrendChart.tsx`. **Test:** `trend.test.ts`.

- [ ] **Failing test:** `monthlyTrend(range)` buckets income/expense by month correctly (minor units).
- [ ] Implement + Recharts line chart on the dashboard → pass. Commit — `feat: monthly trend chart (US-C3)`

---

### Task 6: Budgets — set, progress, warnings (US-E1, US-E2, US-E3)

**Files:** `lib/server/repositories/budgetRepository.ts`, `lib/server/budgets/budgetStatus.ts`, `app/budgets/page.tsx`. **Test:** `budgetStatus.test.ts`.

**Interfaces:** `budgetStatus(categoryId, month): { spentMinor, budgetMinor, pct, state: "ok"|"warn"|"over" }` — `warn` at >80%, `over` at >100% (FR-5.3).

- [ ] **Failing test:** spend 81 of 100 → `warn`; spend 120 → `over`; spend 50 → `ok`.
- [ ] Implement status + budget CRUD + progress bars → pass. Budget status also feeds insight summaries (FR-5.4 — extend Task 4 aggregation).
- [ ] Commit — `feat: per-category budgets with progress + warnings (US-E1/E2/E3)`

---

### Task 7: Scheduled jobs (SRS §10.4)

**Files:** `.github/workflows/cron.yml`, `app/api/jobs/[job]/route.ts` (passcode-protected trigger endpoints).

- [ ] Cron workflow calls protected endpoints: `refresh_exchange_rates` (daily), `generate_weekly_insight` (Sun), `generate_monthly_insight` (1st), `nightly_smoke_test` (daily health check).
- [ ] Each endpoint authorized by the passcode header (reuse middleware). Smoke job alerts (workflow fails) on non-200.
- [ ] Commit — `chore: scheduled jobs via GitHub Actions cron`

---

## Sprint 3 Demo (record)
First AI weekly summary (AI-labeled, dated) → anomaly callout on an unusual transaction → budget bars with a warning state → monthly trend chart → mention the cost cap + template fallback.

## Sprint 3 Definition of Done
- [ ] Cost-capped client blocks at cap (tested); rules-only + template fallbacks proven
- [ ] Weekly/monthly insights generate, cache, and label as AI; disclaimer visible
- [ ] Anomalies flagged; trend chart live; budgets with warn/over states
- [ ] Cron jobs scheduled and authorized
- [ ] Coverage ≥70%; CI green; Sprint 3 stories Done in Trello
