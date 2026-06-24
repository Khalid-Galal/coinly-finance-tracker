# Sprint 2 — AI Categorization + Dashboard MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-categorize transactions with a rules→LLM strategy chain (learning from corrections), and ship the first live dashboard (summary, pie, date filter).

**Architecture:** Strategy pattern — categorization strategies (`RuleStrategy`, `LlmStrategy`) implement one interface, chained in priority order (rules first, LLM fallback). LLM calls batched and routed through a single Gemini client. Dashboard is server components + Recharts client islands.

**Tech Stack:** + `@google/generative-ai`, `recharts`, `shadcn/ui`.

## Global Constraints
(Inherits prior globals.) NFR-3.5: never send account numbers or full raw descriptions to the LLM — send merchant + amount range only. FR-2.4: target ≤1 LLM call per 20 transactions. Every LLM response validated with Zod before use.

---

### Task 1: Default taxonomy + category management (US-B1, US-B2)

**Files:** `lib/server/repositories/categoryRepository.ts`, `lib/server/categories/seed.ts`, `app/api/categories/route.ts`, `app/settings/categories/page.tsx`. **Test:** `categoryRepository.test.ts`, `seed.test.ts`.

**Interfaces:** `seedDefaultTaxonomy()`; `categoryRepository.{create,rename,merge,archive,tree}`. Two-level hierarchy (FR-2.1).

- [ ] Failing test: `seedDefaultTaxonomy()` creates the SRS default set (Food→Groceries, Food→Dining, Transport, Bills, …) with ≥2 levels.
- [ ] Failing test: `merge(a,b)` repoints `b`'s transactions to `a` then archives `b` (no orphaned transactions).
- [ ] Implement repo + seed → pass. Category management UI (add/rename/merge/archive).
- [ ] Commit — `feat: default taxonomy + category management (US-B1, US-B2)`

---

### Task 2: Categorization strategy interface + rules strategy (US-B4 foundation)

**Files:** `lib/server/categorize/types.ts`, `lib/server/categorize/ruleStrategy.ts`, `lib/server/repositories/ruleRepository.ts`. **Test:** `ruleStrategy.test.ts`.

**Interfaces:**
```typescript
export type CatResult = { categoryId: string | null; confidence: number; via: "rule" | "llm" | "none" };
export interface CategorizeStrategy { name: string; categorize(tx: TxForCat): Promise<CatResult>; }
export type TxForCat = { description: string; payee?: string; amountMinor: number };
```

- [ ] **Failing test:** a rule `{matchType:"contains", pattern:"costa", categoryId:"dining"}` makes `ruleStrategy.categorize({description:"COSTA COFFEE"})` return `{categoryId:"dining", confidence:1, via:"rule"}`; non-match returns `via:"none"`.
- [ ] Implement `ruleStrategy` (case-insensitive match over `categorization_rules`) → pass.
- [ ] Commit — `feat: categorization strategy interface + rule strategy`

---

### Task 3: Gemini client + LLM strategy + batching (US-B3, US-B5)

**Files:** `lib/server/infra/geminiClient.ts`, `lib/server/categorize/llmStrategy.ts`. **Test:** `llmStrategy.test.ts` (mock Gemini).

**Interfaces:** `geminiClient.generateJson<T>(prompt, schema): Promise<T>`; `llmStrategy.categorizeBatch(txs: TxForCat[]): Promise<CatResult[]>`.

- [ ] **Failing test (mocked LLM):** a batch of 20 transactions triggers exactly **1** Gemini call (FR-2.4) and maps each to a taxonomy category with a confidence; below-threshold (`<0.6`) results flagged for review (FR-2.5).
- [ ] Implement: build one structured prompt containing the taxonomy + a few-shot sample from history (anonymized merchant + amount range only, NFR-3.5); parse with Zod; split into batches of 20.
- [ ] **Failing test:** malformed LLM JSON → retried once, then those rows return `via:"none"` (no throw).
- [ ] Implement guard → pass. Commit — `feat: Gemini client + batched LLM categorization (US-B3, US-B5)`

---

### Task 4: Hybrid chain + correction→rule learning (US-B4)

**Files:** `lib/server/categorize/categorizeService.ts`. **Test:** `categorizeService.test.ts`.

**Interfaces:** `categorizeService.run(txs)` (chain: rules → LLM for the rest); `categorizeService.applyCorrection(txId, categoryId)` → writes a `merchant_exact` rule (FR-2.6) and re-tags matching future imports without the LLM.

- [ ] **Failing test:** correcting a "Costa" transaction to Dining creates a rule; a *new* "Costa" import is categorized by the rule with **0** LLM calls.
- [ ] **Failing test:** chain prefers rule over LLM when both could match.
- [ ] Implement service → pass. Wire into the import pipeline (Sprint 1 Task 3) as the `categorize` step. Commit — `feat: hybrid categorization + correction learning (US-B4)`

---

### Task 5: Dashboard — summary, pie, date filter (US-C1, US-C2, US-C5)

**Files:** `lib/server/analytics/summary.ts`, `app/dashboard/page.tsx`, `app/dashboard/CategoryPie.tsx`, `lib/server/analytics/dateRange.ts`. **Test:** `summary.test.ts`, `dateRange.test.ts`.

**Interfaces:** `summarize(range): { incomeMinor, expenseMinor, netMinor, byCategory: {categoryId,totalMinor}[] }`; `resolveRange(preset|custom): {from,to}`.

- [ ] **Failing test:** `summarize` over a fixture returns correct income/expense/net in minor units and category totals.
- [ ] **Failing test:** `resolveRange("this-month")` / `"last-3-months"` / `"ytd"` / custom produce correct bounds (use a fixed injected "today", not `Date.now()`, so the test is deterministic).
- [ ] Implement analytics (pure, DB-fed) → pass. Dashboard: summary card (C1) + Recharts pie (C2) + date-range selector (C5); all amounts in base currency with original-currency tooltip (FR-3.7).
- [ ] E2E: dashboard loads, pie renders, switching range updates totals.
- [ ] Commit — `feat: dashboard summary + pie + date filter (US-C1/C2/C5)`

---

## Sprint 2 Demo (record)
On the **deployed** instance: import a CSV → transactions auto-categorized (show confidence flags) → correct one category and re-import to show the learned rule skipping the LLM → dashboard pie + summary for "This Month" vs "Last 3 Months".

## Sprint 2 Definition of Done
- [ ] Rules→LLM chain categorizes imports; corrections create rules that bypass the LLM
- [ ] Batching proven (≤1 call/20 txns) by test; LLM failures degrade without throwing
- [ ] No raw descriptions/account numbers sent to LLM (assert in test)
- [ ] Dashboard (summary, pie, date filter) live on the deployed instance
- [ ] Coverage ≥70%; CI green; Sprint 2 stories Done in Trello
