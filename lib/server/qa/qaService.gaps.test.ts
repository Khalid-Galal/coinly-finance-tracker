import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { db } from "../db";
import { askQuestion } from "./qaService";

// GROUP_C gaps (TEST_PLAN §5 Q&A): formatAnswer multi-row / 1-row-multi-col, BigInt aggregate
// normalization, query-failure -> 200-with-error (never throws), best-effort history. Gemini is
// injected via askQuestion's `generate` param, so no network and no module mock is needed.
const gen = (sql: string) => async () => sql;

async function seed() {
  const acc = await db.account.create({ data: { name: "Main", type: "bank", currency: "EGP" } });
  const dining = await db.category.create({ data: { name: "Dining" } });
  // 2 Dining txns + 1 uncategorized -> GROUP BY category yields 2 rows ("Dining","Uncategorized").
  const rows = [
    {
      date: new Date("2026-03-05"),
      amountMinor: -5000,
      description: "Costa",
      categoryId: dining.id,
    },
    {
      date: new Date("2026-03-20"),
      amountMinor: -3000,
      description: "Spinneys",
      categoryId: dining.id,
    },
    { date: new Date("2026-04-01"), amountMinor: 100000, description: "Salary", categoryId: null },
  ];
  let i = 0;
  for (const r of rows) {
    await db.transaction.create({
      data: {
        accountId: acc.id,
        currency: "EGP",
        source: "manual",
        dedupeHash: `qa-gap-${i++}`,
        ...r,
      },
    });
  }
}

describe("askQuestion — formatAnswer branches", () => {
  beforeEach(seed);

  it("1 row / 1 minor column -> scalar answer formatted from minor units", async () => {
    const r = await askQuestion(
      "net?",
      gen("SELECT SUM(amountMinor) AS totalMinor FROM v_transactions"),
    );
    expect(r.error).toBeUndefined();
    expect(r.rows).toEqual([{ totalMinor: 92000 }]); // 100000 - 5000 - 3000
    expect(r.answer).toBe("EGP 920.00");
  });

  it("1 row / multiple columns -> '1 result.' (not a scalar)", async () => {
    const r = await askQuestion(
      "summary?",
      gen("SELECT COUNT(*) AS n, MIN(date) AS firstDate FROM v_transactions"),
    );
    expect(r.error).toBeUndefined();
    expect(r.rows).toHaveLength(1);
    expect(r.answer).toBe("1 result.");
  });

  it("multiple rows -> 'N results.' (pluralized)", async () => {
    const r = await askQuestion(
      "by category?",
      gen("SELECT category, COUNT(*) AS n FROM v_transactions GROUP BY category"),
    );
    expect(r.error).toBeUndefined();
    expect(r.rows.length).toBeGreaterThan(1);
    expect(r.answer).toBe(`${r.rows.length} results.`);
  });

  it("zero rows -> 'No matching results.'", async () => {
    const r = await askQuestion(
      "huge?",
      gen("SELECT * FROM v_transactions WHERE amountMinor > 999999999"),
    );
    expect(r.error).toBeUndefined();
    expect(r.rows).toEqual([]);
    expect(r.answer).toBe("No matching results.");
  });

  it("normalizes BigInt aggregates to Number (so Response.json can serialize them)", async () => {
    const r = await askQuestion("count", gen("SELECT COUNT(*) AS n FROM v_transactions"));
    expect(typeof r.rows[0].n).toBe("number");
    expect(r.rows[0].n).toBe(3);
  });
});

describe("askQuestion — failure handling (returns error in body, never throws)", () => {
  beforeEach(seed);
  afterEach(() => vi.restoreAllMocks());

  it("an allowlisted view but a bad column -> 200-shape result with `error`, empty rows", async () => {
    const r = await askQuestion("oops", gen("SELECT nosuchcol FROM v_transactions"));
    expect(r.error).toMatch(/Query failed/i);
    expect(r.rows).toEqual([]);
    expect(r.answer).toBe("");
  });

  it("a history write failure is swallowed — the answer is still returned", async () => {
    vi.spyOn(db.qaHistory, "create").mockRejectedValueOnce(new Error("disk full"));
    const r = await askQuestion("count", gen("SELECT COUNT(*) AS n FROM v_transactions"));
    expect(r.error).toBeUndefined();
    expect(r.answer).toBe("3");
  });

  it("an empty question short-circuits before generating any SQL", async () => {
    let called = false;
    const r = await askQuestion("   ", async () => {
      called = true;
      return "SELECT 1";
    });
    expect(called).toBe(false);
    expect(r.sql).toBeNull();
    expect(r.error).toMatch(/empty/i);
  });
});
