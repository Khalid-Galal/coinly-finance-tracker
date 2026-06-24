# Sprint 5 — Polish, Settings, Mobile, Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take Coinly from feature-complete to "outstanding" — chart drill-down, mobile responsive, first-run wizard, settings, data export/import, accessibility, and the performance pass.

**Architecture:** No new architecture — fills out UX, settings, and quality. All amounts still minor-unit; switching base currency recalculates display only (originals preserved, FR-7.7).

**Tech Stack:** (carried) + `axe-core`/Playwright a11y assertions.

## Global Constraints
(Inherits prior globals.) NFR-5.1: WCAG 2.1 AA contrast + keyboard nav. NFR-1.1: dashboard <2s at 10k transactions. NFR-3.5 still holds. **§4 priority: this whole sprint is P3 — if behind, these are the first items to move to v2 (except C6 mobile, which is a rubric requirement).**

---

### Task 1: Chart drill-down (US-C4)
**Files:** update `app/dashboard/*`, `app/transactions/page.tsx` (accept category+range query params).
- [ ] Failing test: clicking a pie segment routes to the transactions list filtered to that category+range.
- [ ] Implement drill-down → pass. Commit — `feat: chart drill-down to filtered transactions (US-C4)`

### Task 2: Mobile responsive (US-C6) — NOT cuttable
**Files:** responsive styles across `app/**`.
- [ ] E2E at 360px viewport: dashboard, transactions, quick-add, and Ask pages render without overflow (FR-3.8).
- [ ] Implement responsive layout → pass. Commit — `feat: responsive layout to 360px (US-C6)`

### Task 3: Categorization accuracy report (US-B7)
**Files:** `lib/server/categorize/accuracy.ts`, `app/about/accuracy/page.tsx`. **Test:** `accuracy.test.ts`.
- [ ] Failing test: given AI assignments + later corrections, `accuracyReport()` returns correct/total per period (FR-2.7).
- [ ] Implement + page → pass. Commit — `feat: categorization accuracy report (US-B7)`

### Task 4: Voice quick-add (US-F5)
**Files:** `lib/server/qa/parseTxnDictation.ts`, update quick-add UI. **Test:** `parseTxnDictation.test.ts` (mock LLM).
- [ ] Failing test: `"add 250 pounds coffee from Costa"` → `{ amountMinor: 25000, currency: "EGP", description: "coffee", payee: "Costa" }` **draft** (user confirms before save, FR-6.6).
- [ ] Implement LLM parse → confirmation draft → pass. Commit — `feat: voice quick-add dictation with confirm (US-F5)`

### Task 5: First-run setup wizard (US-G1)
**Files:** `app/setup/page.tsx`, `lib/server/settings/firstRun.ts`. **Test:** `firstRun.test.ts`.
- [ ] Failing test: with no settings row, app routes to `/setup`; completing it sets base currency, primary account, seeds taxonomy (NFR-5.3).
- [ ] Implement wizard → pass. E2E: fresh DB → wizard completes → dashboard. Commit — `feat: first-run setup wizard (US-G1)`

### Task 6: Change base currency + data export/import (US-G2, US-G3)
**Files:** `lib/server/settings/currency.ts`, `lib/server/backup/exportJson.ts`, `lib/server/backup/importJson.ts`, settings UI. **Test:** `currency.test.ts`, `backup.test.ts`.
- [ ] Failing test: switching base currency recalculates displayed totals but stored `amountMinor`/`currency` are unchanged (FR-7.7).
- [ ] Failing test: `exportJson()` then `importJson()` round-trips all entities byte-for-byte equivalent (FR-7.5/7.6). **US-G3 is in the §4 v2 cut set.**
- [ ] Implement → pass. Commit — `feat: base-currency switch + JSON export/import (US-G2, US-G3)`

### Task 7: Accessibility + performance pass
**Files:** a11y fixes across `app/**`; add DB indexes if needed.
- [ ] Playwright + axe: 0 critical violations on dashboard, transactions, Ask (NFR-5.1); full keyboard nav.
- [ ] Perf: seed 10k transactions; assert dashboard renders <2s (NFR-1.1) — add indexes/pagination if needed.
- [ ] Commit — `fix: WCAG AA a11y + dashboard perf at 10k transactions`

## Sprint 5 Demo (record)
Fresh-install wizard → responsive view on a phone-sized window → drill from pie into transactions → change base currency live → export/import backup → mention a11y + the <2s dashboard.

## Sprint 5 Definition of Done
- [ ] Wizard, settings, export/import, currency switch, drill-down, accuracy report, voice quick-add working
- [ ] Responsive to 360px (E2E); axe shows 0 critical; dashboard <2s at 10k txns
- [ ] Any cut P3 items explicitly moved to the v2 column (board reads 100% Done on committed scope)
- [ ] Coverage ≥70%; CI green
