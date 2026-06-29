import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { db } from "../db";

// TEST_PLAN §5 Insights insightService gaps: monthly path (monthRange + detectAnomalies),
// zero-txn summarize, prompt-content + top-6 truncation, getRecentInsights ordering/take.
vi.mock("../infra/geminiClient", () => ({ geminiGenerateText: vi.fn() }));
import { geminiGenerateText } from "../infra/geminiClient";
import { generateInsight, getRecentInsights } from "./insightService";

const mockGen = vi.mocked(geminiGenerateText);
const NOW = new Date("2026-06-24T10:00:00Z");

beforeEach(() => {
  mockGen.mockReset();
  mockGen.mockResolvedValue("ok insight");
});

afterEach(() => {
  delete process.env.INSIGHT_DAILY_LLM_CAP;
});

async function account() {
  return (await db.account.create({ data: { name: "A", type: "bank", currency: "EGP" } })).id;
}

async function spend(accountId: string, date: string, minor: number, hash: string, categoryId?: string) {
  await db.transaction.create({
    data: {
      accountId,
      date: new Date(date),
      amountMinor: minor,
      currency: "EGP",
      description: "x",
      categoryId,
      source: "manual",
      dedupeHash: hash,
    },
  });
}

const prompt = () => mockGen.mock.calls[0][0] as string;

describe("generateInsight — monthly path", () => {
  it("summarizes the calendar month and runs anomaly detection in the prompt", async () => {
    const a = await account();
    const dining = (await db.category.create({ data: { name: "Dining" } })).id;
    await spend(a, "2026-06-10T00:00:00Z", -20000, "jun", dining); // current-month spike
    await spend(a, "2026-05-10T00:00:00Z", -5000, "may", dining);
    await spend(a, "2026-04-10T00:00:00Z", -5000, "apr", dining);
    await spend(a, "2026-03-10T00:00:00Z", -5000, "mar", dining);

    const insight = await generateInsight("monthly", NOW);

    expect(insight.type).toBe("monthly");
    // periodStart/End must be the calendar month of NOW -> proves monthRange(monthKeyOf(now)).
    expect(insight.periodStart.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(insight.periodEnd.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    // The anomaly path is monthly-only: the Dining spike must surface in the prompt.
    expect(prompt()).toMatch(/Dining/);
    expect(prompt()).toMatch(/above their usual average/i);
  });
});

describe("generateInsight — degenerate data", () => {
  it("generates an insight even when there are no transactions", async () => {
    await account(); // no transactions at all
    const insight = await generateInsight("weekly", NOW);
    expect(insight).toBeTruthy();
    expect(prompt()).toMatch(/Income: 0\.00/);
    expect(prompt()).toMatch(/Spending by category: none/);
  });

  it("includes at most the top 6 categories in the prompt", async () => {
    const a = await account();
    for (let i = 0; i < 8; i++) {
      const c = (await db.category.create({ data: { name: `Cat${i}` } })).id;
      await spend(a, "2026-06-22T00:00:00Z", -(1000 * (i + 1)), `c${i}`, c); // ascending spend
    }
    await generateInsight("weekly", NOW);
    const line = prompt()
      .split("\n")
      .find((l) => l.startsWith("Spending by category:"))!;
    const listed = line.replace("Spending by category: ", "").split(", ");
    expect(listed).toHaveLength(6);
    expect(line).toMatch(/Cat7:/); // biggest spender included
    expect(line).not.toMatch(/Cat0:/); // smallest two dropped
  });
});

describe("getRecentInsights", () => {
  it("returns newest-first, capped at 10", async () => {
    for (let i = 0; i < 12; i++) {
      await db.insight.create({
        data: {
          periodStart: new Date("2026-06-01"),
          periodEnd: new Date("2026-07-01"),
          type: "weekly",
          content: `n${i}`,
          model: null,
          generatedAt: new Date(Date.UTC(2026, 5, i + 1)),
        },
      });
    }
    const recent = await getRecentInsights();
    expect(recent).toHaveLength(10);
    expect(recent[0].content).toBe("n11"); // newest (2026-06-12)
    expect(recent[9].content).toBe("n2"); // 10th newest
  });

  it("respects an explicit limit", async () => {
    for (let i = 0; i < 3; i++) {
      await db.insight.create({
        data: {
          periodStart: new Date("2026-06-01"),
          periodEnd: new Date("2026-07-01"),
          type: "weekly",
          content: `x${i}`,
          model: null,
        },
      });
    }
    expect(await getRecentInsights(2)).toHaveLength(2);
  });
});
