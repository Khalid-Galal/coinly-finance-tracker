# Sprint 1 — Data Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ingest transactions from three Egyptian bank CSVs and manual entry, deduplicated, across multiple accounts, with daily currency conversion — viewable in a basic list.

**Architecture:** Adapter pattern for parsers (one per bank, common interface), Pipeline pattern for import (parse → dedupe → normalize → persist). Logic in `lib/server/`, thin route handlers, server-component list page.

**Tech Stack:** (carried from Sprint 0) + `papaparse` for CSV, `zod` for input validation.

## Global Constraints
(Inherits Sprint 0 globals.) Money always in integer minor units. Parsers are pure functions over file text — no DB access inside a parser. Dedupe hash = SHA-256 of `date|amountMinor|description|accountId`.

---

### Task 1: Parser interface + CIB parser (US-A2)

**Files:**
- Create: `lib/server/import/types.ts`, `lib/server/import/parsers/cib.ts`, `lib/server/import/registry.ts`
- Test: `lib/server/import/parsers/cib.test.ts`
- Fixture: `lib/server/import/parsers/__fixtures__/cib-sample.csv`

**Interfaces:**
- Produces:
```typescript
export type ParsedRow = { date: string; amountMinor: number; currency: string; description: string; payee?: string; rawCsvRow: string };
export interface BankStatementParser { readonly bank: string; canParse(headerLine: string): boolean; parse(csvText: string): ParsedRow[]; }
```
- Consumes: nothing (pure).

- [ ] **Step 1: Add a real CIB fixture** (2–3 rows copied from an actual CIB export header layout; redact account numbers).
- [ ] **Step 2: Failing test**

```typescript
// cib.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { cibParser } from "./cib";
const csv = readFileSync(__dirname + "/__fixtures__/cib-sample.csv", "utf8");
describe("cibParser", () => {
  it("detects its own format", () => { expect(cibParser.canParse(csv.split("\n")[0])).toBe(true); });
  it("parses amount to minor units and ISO date", () => {
    const rows = cibParser.parse(csv);
    expect(rows[0].amountMinor).toBe(15050);          // "150.50" -> 15050
    expect(rows[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(rows[0].currency).toBe("EGP");
  });
});
```

- [ ] **Step 3: Run → FAIL.** `npx vitest run cib`
- [ ] **Step 4: Implement `cibParser`** using `papaparse`; map CIB columns → `ParsedRow`; convert `"150.50"` → `Math.round(parseFloat(x)*100)`; normalize date to ISO. (Header detection in `canParse` by matching CIB's column names.)
- [ ] **Step 5: Run → PASS.**
- [ ] **Step 6: Registry**

```typescript
// registry.ts
import { cibParser } from "./parsers/cib";
const parsers = [cibParser];
export function pickParser(headerLine: string) { return parsers.find(p => p.canParse(headerLine)); }
```
- [ ] **Step 7: Commit** — `feat: parser interface + CIB CSV parser (US-A2)`

---

### Task 2: Banque Misr + NBE parsers (US-A3, US-A4)

**Files:** Create `parsers/banqueMisr.ts`, `parsers/nbe.ts` (+ fixtures + tests mirroring Task 1). Register both in `registry.ts`.

> **US-A4 (NBE) is in the §4 v2 cut set** — if behind by end of Sprint 1, ship CIB+BM and move NBE to v2 (manual entry covers NBE meanwhile).

- [ ] Per bank: fixture → failing parse test (assert minor-unit + ISO date) → implement → pass → register → commit.
- [ ] **Negative test:** `pickParser("garbage,header")` returns `undefined`; import route surfaces "unsupported format."

---

### Task 3: Dedupe + import pipeline (US-A5)

**Files:**
- Create: `lib/server/import/hash.ts`, `lib/server/import/importService.ts`
- Test: `lib/server/import/hash.test.ts`, `lib/server/import/importService.test.ts`

**Interfaces:**
- Produces: `dedupeHash(row, accountId): string`; `importCsv(csvText, accountId): Promise<{ imported: number; skipped: number }>`.

- [ ] **Step 1: Failing hash test**

```typescript
// hash.test.ts
import { describe, it, expect } from "vitest";
import { dedupeHash } from "./hash";
it("is stable and field-sensitive", () => {
  const a = dedupeHash({ date: "2026-01-01", amountMinor: 100, description: "Costa" }, "acc1");
  const b = dedupeHash({ date: "2026-01-01", amountMinor: 100, description: "Costa" }, "acc1");
  const c = dedupeHash({ date: "2026-01-01", amountMinor: 101, description: "Costa" }, "acc1");
  expect(a).toBe(b); expect(a).not.toBe(c);
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement**

```typescript
// hash.ts
import { createHash } from "node:crypto";
export function dedupeHash(r: { date: string; amountMinor: number; description: string }, accountId: string): string {
  return createHash("sha256").update(`${r.date}|${r.amountMinor}|${r.description}|${accountId}`).digest("hex");
}
```
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: importService test** (mock repo): importing the same CSV twice imports N then skips N (re-import safe). Assert `{ imported: N, skipped: 0 }` then `{ imported: 0, skipped: N }`.
- [ ] **Step 6: Implement pipeline** `parse(pickParser) → map+hash → filter existing hashes → persist`. Each step a named function (Pipeline pattern); the `@@unique(dedupeHash)` from the schema is the safety net.
- [ ] **Step 7: Run → PASS. Commit** — `feat: dedupe hash + import pipeline (US-A5)`

---

### Task 4: Import API route + upload UI (US-A2 cont.)

**Files:** Create `app/api/import/route.ts` (POST multipart → `importCsv`), `app/import/page.tsx` (upload + preview + duplicate count + confirm).

- [ ] Zod-validate the upload (file present, account selected). Route returns `{ imported, skipped }`.
- [ ] E2E (`e2e/import.spec.ts`): upload fixture CSV → see imported count → re-upload → see all skipped.
- [ ] Commit — `feat: CSV import route + upload UI`

---

### Task 5: Manual transaction entry (US-A6)

**Files:** Create `lib/server/repositories/transactionRepository.ts`, `app/api/transactions/route.ts`, `app/quick-add/page.tsx`, `app/transactions/page.tsx` (list).
**Test:** `transactionRepository.test.ts`.

**Interfaces:** `transactionRepository.create(input)`, `.list(filter)`, `.update(id, patch)`, `.remove(id)`. `TransactionInput` validated by a shared Zod schema in `lib/shared/schemas.ts` (FR-1.4 fields).

- [ ] Failing repo test: create + list returns it; create writes an `AuditLog` row (FR-1.7).
- [ ] Implement repo (create/list/update/delete, each update/delete also writes AuditLog).
- [ ] Quick-add form: keyboard-driven, ≤8 keystrokes target (NFR-5.2) — date defaults today, amount autofocus, Enter saves.
- [ ] Transactions list (server component) renders merged CSV + manual rows.
- [ ] E2E: add a manual transaction → see it in the list. Commit — `feat: manual entry + transaction repo + list (US-A6)`

---

### Task 6: Multi-account management (US-A7)

**Files:** `app/api/accounts/route.ts`, `app/settings/accounts/page.tsx`. Reuse `accountRepository` from Sprint 0.

- [ ] Failing test: archiving an account excludes it from `list()` but keeps its transactions.
- [ ] Implement add / rename / archive; account selector feeds import + quick-add.
- [ ] Commit — `feat: multi-account management (US-A7)`

---

### Task 7: Daily exchange rates + conversion (US-A8)

**Files:** Create `lib/server/infra/exchangeRateClient.ts`, `lib/server/money/convert.ts`, `lib/server/repositories/exchangeRateRepository.ts`.
**Test:** `convert.test.ts`, `exchangeRateClient.test.ts`.

**Interfaces:** `fetchRates(base): Promise<Record<string,number>>`; `convertMinor(amountMinor, from, to, rateOnDate): number`.

- [ ] **Step 1: Failing conversion test** (pure, exact rounding)

```typescript
// convert.test.ts
import { convertMinor } from "./convert";
it("converts minor units with half-up rounding", () => {
  // 100.00 USD at 50.5 EGP/USD -> 5050.00 EGP -> 505000 minor
  expect(convertMinor(10000, "USD", "EGP", 50.5)).toBe(505000);
});
```
- [ ] **Step 2: Run → FAIL → implement `convertMinor` (integer math, `Math.round`) → PASS.**
- [ ] **Step 3: Client test** — mock `fetch`; assert it parses the free API shape; on network error returns the cached most-recent rates (fallback from SRS §6.2).
- [ ] **Step 4: Implement client + repository** (upsert by `[date,base,quote]`); a daily refresh is wired as a GitHub Actions cron in Sprint 3 (job exists in SRS §10.4).
- [ ] **Step 5: Commit** — `feat: exchange rates + currency conversion (US-A8)`

---

## Sprint 1 Demo (record for sprint review)
Import a CIB CSV and a Banque Misr CSV → add one manual cash transaction → show the merged list across accounts with no duplicates → re-import a file and show 0 added. Mention currency conversion on a foreign-currency row.

## Sprint 1 Definition of Done
- [ ] CIB + Banque Misr (+ NBE unless cut) parsers, each with passing fixture tests
- [ ] Re-import is duplicate-safe (proven by test + demo)
- [ ] Manual entry + multi-account + transaction list working on the live instance
- [ ] Exchange-rate conversion unit-tested; edit/delete write audit log
- [ ] Coverage ≥70%; CI green; all Sprint 1 stories in Trello Done
