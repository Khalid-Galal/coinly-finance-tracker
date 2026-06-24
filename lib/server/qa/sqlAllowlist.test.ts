import { describe, it, expect } from "vitest";
import { validateSql } from "./sqlAllowlist";

const ALLOWED = ["v_transactions", "v_category_totals"];
const ok = (s: string) => validateSql(s, ALLOWED).ok;

describe("validateSql", () => {
  it("allows a single SELECT against an allowlisted view", () => {
    expect(
      ok("SELECT categoryId, SUM(amountMinor) FROM v_category_totals GROUP BY categoryId"),
    ).toBe(true);
    expect(ok("SELECT * FROM v_transactions WHERE amountMinor < 0")).toBe(true);
  });

  it("rejects writes and DDL", () => {
    expect(ok("INSERT INTO v_transactions (id) VALUES ('x')")).toBe(false);
    expect(ok("UPDATE v_transactions SET amountMinor = 0")).toBe(false);
    expect(ok("DELETE FROM v_transactions")).toBe(false);
    expect(ok("DROP TABLE v_transactions")).toBe(false);
  });

  it("rejects multiple statements and comment-smuggling", () => {
    expect(ok("SELECT 1; DROP TABLE Account")).toBe(false);
    expect(ok("SELECT 1 -- ; DROP TABLE Account")).toBe(false);
    expect(ok("SELECT 1 /* x */ FROM v_transactions")).toBe(false);
  });

  it("rejects tables that are not on the allowlist", () => {
    expect(ok("SELECT * FROM Account")).toBe(false);
    expect(ok("SELECT * FROM sqlite_master")).toBe(false);
    expect(validateSql("SELECT * FROM Account", ALLOWED)).toMatchObject({ ok: false });
  });

  it("rejects unparseable input", () => {
    expect(ok("not sql at all ;;;")).toBe(false);
  });
});
