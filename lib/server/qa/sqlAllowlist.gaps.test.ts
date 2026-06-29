import { describe, it, expect } from "vitest";
import { validateSql } from "./sqlAllowlist";

// GROUP_C gaps (TEST_PLAN §5 sqlAllowlist): table-valued built-ins (json_each), scalar built-ins,
// very-long-SQL handling, and empty/whitespace input. The security property under test is that
// NOTHING reaches a base table — not the exact classification of a harmless built-in.
const ALLOWED = ["v_transactions", "v_category_totals"];
const ok = (s: string) => validateSql(s, ALLOWED).ok;

describe("validateSql — built-in functions", () => {
  it("allows json_each on a literal — node-sql-parser does not list it as a table (safe: no DB table touched)", () => {
    // FINDING: the table-valued built-in json_each is NOT surfaced by tableList, so it passes the
    // allowlist. This is harmless when its argument is a literal (it reads no database table), and
    // the only way to reach real data through it is a subquery — which IS caught (next test).
    expect(ok("SELECT value FROM json_each('[1,2,3]')")).toBe(true);
  });

  it("still rejects a base table smuggled in through json_each's argument (the real boundary)", () => {
    expect(ok("SELECT value FROM json_each((SELECT value FROM Setting))")).toBe(false);
  });

  it("allows pure scalar SELECTs with no table reference", () => {
    expect(ok("SELECT 1")).toBe(true);
    expect(ok("SELECT 1 + 1 AS two")).toBe(true);
  });
});

describe("validateSql — input robustness", () => {
  it("rejects empty and whitespace-only input without throwing", () => {
    expect(ok("")).toBe(false);
    expect(ok("   ")).toBe(false);
    expect(ok("\n\t")).toBe(false);
  });

  it("validates a very long but legitimate SELECT quickly (no catastrophic backtracking)", () => {
    const clauses = Array.from({ length: 400 }, (_, i) => `amountMinor <> ${i}`).join(" AND ");
    const sql = `SELECT * FROM v_transactions WHERE ${clauses}`;
    const start = process.hrtime.bigint();
    const result = ok(sql);
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    expect(result).toBe(true);
    expect(ms).toBeLessThan(2000);
  });

  it("rejects a very long non-SQL blob (unparseable) rather than hanging", () => {
    expect(ok("x".repeat(5000))).toBe(false);
  });
});
