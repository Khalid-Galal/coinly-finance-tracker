# Sprint 4 — Q&A Chat, Voice, Evaluation Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conversational Q&A over finances via guarded LLM-to-SQL, with voice input and a CI-run accuracy evaluation harness. **This is the initiative tier that wins the 5 — protect it.**

**Architecture:** Guarded LLM-to-SQL — the LLM generates SQL from a question + schema; every query passes a parser-based allowlist (single SELECT against known views only) before execution against a read-only connection. Voice via browser Web Speech API. Eval harness runs ≥30 known-answer questions in CI.

**Tech Stack:** + `node-sql-parser` (AST validation — do **not** hand-roll SQL parsing).

## Global Constraints
(Inherits prior globals.) NFR-3.4 / FR-6.3: reject every non-SELECT, multi-statement, comment, or unknown-table query **before** execution. FR-6.7: keep last 5 turns of context. FR-6.8: eval set ≥30 questions. Q&A runs against read-only DB views, never the base tables for writes.

---

### Task 1: Read-only views + SQL allowlist validator (US-F2) — SECURITY BOUNDARY

**Files:** `prisma/migrations/*_qa_views.sql` (create `v_transactions`, `v_category_totals`, etc.), `lib/server/qa/sqlAllowlist.ts`. **Test:** `sqlAllowlist.test.ts`.

**Interfaces:** `validateSql(sql: string, allowedTables: string[]): { ok: true } | { ok: false; reason: string }`.

- [ ] **Step 1: Write the failing test — positive AND negative cases (the negatives are the point)**

```typescript
// sqlAllowlist.test.ts
import { describe, it, expect } from "vitest";
import { validateSql } from "./sqlAllowlist";
const ALLOWED = ["v_transactions", "v_category_totals"];
const ok = (s: string) => validateSql(s, ALLOWED).ok;

describe("validateSql", () => {
  it("allows a plain SELECT against a known view", () => {
    expect(ok("SELECT categoryId, SUM(amountMinor) FROM v_category_totals GROUP BY categoryId")).toBe(true);
  });
  it("rejects INSERT/UPDATE/DELETE/DDL", () => {
    expect(ok("INSERT INTO v_transactions VALUES (1)")).toBe(false);
    expect(ok("UPDATE v_transactions SET amountMinor = 0")).toBe(false);
    expect(ok("DELETE FROM v_transactions")).toBe(false);
    expect(ok("DROP TABLE v_transactions")).toBe(false);
  });
  it("rejects multi-statement and comment-smuggling", () => {
    expect(ok("SELECT 1; DROP TABLE Account")).toBe(false);
    expect(ok("SELECT 1 -- ; DROP TABLE Account")).toBe(false);
  });
  it("rejects unknown tables", () => {
    expect(ok("SELECT * FROM Account")).toBe(false);            // base table, not an allowed view
    expect(ok("SELECT * FROM sqlite_master")).toBe(false);
  });
});
```

- [ ] **Step 2: Run → FAIL.** `npx vitest run sqlAllowlist`

- [ ] **Step 3: Implement with an AST parser (reference implementation)**

```typescript
// lib/server/qa/sqlAllowlist.ts
import { Parser } from "node-sql-parser";
const parser = new Parser();

export function validateSql(sql: string, allowedTables: string[]): { ok: true } | { ok: false; reason: string } {
  // 1) reject comments outright (defeats comment-smuggling)
  if (/--|\/\*|\*\//.test(sql)) return { ok: false, reason: "comments not allowed" };
  let ast;
  try { ast = parser.astify(sql, { database: "sqlite" }); }
  catch { return { ok: false, reason: "unparseable SQL" }; }
  // 2) exactly one statement
  const stmts = Array.isArray(ast) ? ast : [ast];
  if (stmts.length !== 1) return { ok: false, reason: "multiple statements" };
  const stmt = stmts[0] as { type?: string };
  // 3) must be SELECT
  if (stmt.type !== "select") return { ok: false, reason: `non-SELECT: ${stmt.type}` };
  // 4) every referenced table must be in the allowlist
  const tables = parser.tableList(sql).map(t => t.split("::").pop()!.toLowerCase());
  const allowed = new Set(allowedTables.map(t => t.toLowerCase()));
  for (const t of tables) if (!allowed.has(t)) return { ok: false, reason: `table not allowed: ${t}` };
  return { ok: true };
}
```

- [ ] **Step 4: Run → PASS** (all positive + negative cases). `npx vitest run sqlAllowlist`
- [ ] **Step 5: Commit** — `feat: parser-based SQL allowlist guard + read-only views (US-F2)`

---

### Task 2: LLM-to-SQL Q&A pipeline (US-F1, US-F3)

**Files:** `lib/server/qa/qaService.ts`, `lib/server/qa/readonlyExec.ts`, `prompts/qa-sql.v1.md`, `app/ask/page.tsx`, `app/api/qa/route.ts`. **Test:** `qaService.test.ts` (mock LLM).

**Interfaces:** `qaService.ask(question, history): Promise<{ answer: string; rows: unknown[]; sql: string }>`. Pipeline: question + schema + last-5-turns → LLM SQL → `validateSql` → read-only execute → format answer.

- [ ] **Failing test (mocked LLM):** a known question yields SQL that passes the allowlist and returns the expected rows; the response includes `sql` for transparency (FR-6.4/F3).
- [ ] **Failing test:** when the LLM emits a non-SELECT, `qaService` rejects it (never executes) and returns a safe "couldn't answer that safely" message.
- [ ] Implement pipeline; `readonlyExec` uses a read-only connection. Answer rendered three ways: sentence + table + expandable SQL (FR-6.4).
- [ ] Commit — `feat: guarded LLM-to-SQL Q&A pipeline (US-F1, US-F3)`

---

### Task 3: Voice input via Web Speech API (US-F4)

**Files:** `app/ask/useSpeech.ts` (client hook), update `app/ask/page.tsx`. **Test:** `useSpeech.test.ts` (jsdom mock of `webkitSpeechRecognition`).

**Interfaces:** `useSpeech(): { listening, transcript, start, stop, supported }`.

- [ ] **Failing test:** when the API is unavailable (Firefox), `supported` is `false` and the UI shows text-only mode (no throw) — graceful degradation (SRS §2.5).
- [ ] Implement hook → mic button transcribes into the Q&A input → pass.
- [ ] E2E (Chromium): the mic affordance renders; (real speech isn't E2E-testable — cover with the unit mock + a manual test-plan entry).
- [ ] Commit — `feat: voice input for Q&A via Web Speech API (US-F4)`

---

### Task 4: LLM-to-SQL evaluation harness (US-F6) — initiative differentiator

**Files:** `eval/qa-eval-set.json` (≥30 Q/A pairs vs a fixture DB), `eval/runEval.ts`, `eval/fixture.sql`, `.github/workflows/eval.yml`. **Test:** the harness *is* the test; add `eval/runEval.test.ts` for the scorer.

**Interfaces:** `runEval(): { total, exact, tolerance, sqlValidRate, allowlistPassRate, e2eSuccess }` → writes dated JSON to `docs/evals/`.

- [ ] **Step 1:** Author ≥30 questions with known answers against a seeded fixture DB (mix: totals, top-category, date-filtered, comparisons).
- [ ] **Step 2: Failing scorer test:** exact-match for numeric/categorical; tolerance-match for floats; counts SQL validity + allowlist pass + end-to-end success (SRS §9.3 metrics).
- [ ] **Step 3:** Implement `runEval` → pass. Commit dated results to `docs/evals/`.
- [ ] **Step 4:** `eval.yml` runs weekly (cron) + on demand; uploads the JSON as an artifact (honest accuracy trail).
- [ ] **Step 5: Commit** — `feat: LLM-to-SQL evaluation harness with metrics (US-F6)`

---

### Task 5: Coverage push to ≥70% core logic (US-G6)

**Files:** add tests across `lib/server/**`. 

- [ ] Run `npm run test:coverage`; fill gaps until lines ≥70% (CI already gates this — make it comfortably green, not barely).
- [ ] Commit — `test: raise coverage on core logic to ≥70% (US-G6)`

---

## Sprint 4 Demo (record — the centerpiece)
On the **deployed** instance: ask a typed question ("how much did I spend on dining last month?") → show the answer + the generated SQL → ask a follow-up ("and the month before?") using context → **ask one by voice** → show the eval report's measured accuracy. The voice moment + the eval trail are the high-impact differentiators.

## Sprint 4 Definition of Done
- [ ] SQL allowlist rejects every non-SELECT/multi-statement/comment/unknown-table case (tested)
- [ ] Q&A returns sentence + table + SQL; rejects unsafe SQL without executing
- [ ] Voice input works in Chrome/Edge; degrades to text-only elsewhere
- [ ] Eval harness ≥30 questions, runs in CI, dated results committed to `docs/evals/`
- [ ] Coverage ≥70%; CI green; Sprint 4 stories Done in Trello
