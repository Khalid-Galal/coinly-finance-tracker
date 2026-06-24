import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "../db";

// Gemini is mocked: these tests exercise the guard + execution + formatting, not the network.
vi.mock("../infra/geminiClient", () => ({ geminiGenerateText: vi.fn() }));
import { geminiGenerateText } from "../infra/geminiClient";
import { askQuestion, extractSql } from "./qaService";

const mockGen = vi.mocked(geminiGenerateText);

async function seed() {
  const acc = await db.account.create({ data: { name: "Main", type: "bank", currency: "EGP" } });
  const dining = await db.category.create({ data: { name: "Dining" } });
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
        dedupeHash: `seed-${i++}`,
        ...r,
      },
    });
  }
}

describe("extractSql", () => {
  it("strips markdown fences and trailing semicolons", () => {
    expect(extractSql("```sql\nSELECT 1\n```")).toBe("SELECT 1");
    expect(extractSql("  SELECT 1 ;; ")).toBe("SELECT 1");
    expect(extractSql("```\nSELECT 2;\n```")).toBe("SELECT 2");
  });
});

describe("askQuestion", () => {
  beforeEach(seed);

  it("generates SQL, executes read-only, and returns rows + a scalar answer", async () => {
    mockGen.mockResolvedValue("SELECT COUNT(*) AS n FROM v_transactions");
    const r = await askQuestion("how many transactions are there?");
    expect(r.error).toBeUndefined();
    expect(r.rows).toEqual([{ n: 3 }]);
    expect(r.answer).toBe("n: 3");
    expect(r.sql).toContain("v_transactions");
  });

  it("filters by month via the normalized ISO date and formats money from minor units", async () => {
    mockGen.mockResolvedValue(
      "SELECT SUM(expenseMinor) AS totalMinor FROM v_category_totals WHERE month = '2026-03'",
    );
    const r = await askQuestion("how much did I spend in March?");
    expect(r.error).toBeUndefined();
    expect(r.rows).toEqual([{ totalMinor: 8000 }]);
    expect(r.answer).toBe("totalMinor: 80.00");
  });

  it("strips markdown fences from the LLM response before executing", async () => {
    mockGen.mockResolvedValue("```sql\nSELECT COUNT(*) AS n FROM v_transactions\n```");
    const r = await askQuestion("count them");
    expect(r.sql).toBe("SELECT COUNT(*) AS n FROM v_transactions");
    expect(r.rows).toEqual([{ n: 3 }]);
  });

  it("rejects a write statement and never touches the data", async () => {
    mockGen.mockResolvedValue("DELETE FROM v_transactions");
    const r = await askQuestion("wipe my data");
    expect(r.error).toMatch(/rejected/i);
    expect(r.rows).toEqual([]);
    expect(await db.transaction.count()).toBe(3);
  });

  it("rejects a query against a non-allowlisted table", async () => {
    mockGen.mockResolvedValue("SELECT * FROM Account");
    const r = await askQuestion("list my accounts");
    expect(r.error).toMatch(/rejected/i);
    expect(r.rows).toEqual([]);
  });

  it("logs the question and generated SQL to QaHistory", async () => {
    mockGen.mockResolvedValue("SELECT COUNT(*) AS n FROM v_transactions");
    await askQuestion("how many?");
    const history = await db.qaHistory.findMany();
    expect(history).toHaveLength(1);
    expect(history[0].question).toBe("how many?");
    expect(history[0].generatedSql).toContain("v_transactions");
  });
});
