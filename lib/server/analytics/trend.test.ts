import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db";
import { monthlyTrend } from "./trend";
import { lastNMonths } from "./dateRange";

let accountId = "";

beforeEach(async () => {
  accountId = (await db.account.create({ data: { name: "M", type: "bank", currency: "EGP" } })).id;
  const rows = [
    { date: "2026-01-10", amountMinor: 500000 }, // income
    { date: "2026-01-20", amountMinor: -20000 }, // expense
    { date: "2026-03-05", amountMinor: -8000 }, // expense (Feb has none)
  ];
  let i = 0;
  for (const r of rows) {
    await db.transaction.create({
      data: {
        accountId,
        date: new Date(r.date),
        amountMinor: r.amountMinor,
        currency: "EGP",
        description: "x",
        source: "manual",
        dedupeHash: `t-${i++}`,
      },
    });
  }
});

describe("monthlyTrend", () => {
  it("buckets income/expense/net per month and fills empty months with zeros", async () => {
    const trend = await monthlyTrend({
      from: new Date(Date.UTC(2026, 0, 1)),
      to: new Date(Date.UTC(2026, 3, 1)), // Jan, Feb, Mar
    });

    expect(trend.map((p) => p.month)).toEqual(["2026-01", "2026-02", "2026-03"]);
    expect(trend[0]).toMatchObject({ incomeMinor: 500000, expenseMinor: 20000, netMinor: 480000 });
    expect(trend[1]).toMatchObject({ incomeMinor: 0, expenseMinor: 0, netMinor: 0 }); // Feb gap
    expect(trend[2]).toMatchObject({ incomeMinor: 0, expenseMinor: 8000, netMinor: -8000 });
  });

  it("excludes transactions outside the range", async () => {
    const trend = await monthlyTrend({
      from: new Date(Date.UTC(2026, 2, 1)),
      to: new Date(Date.UTC(2026, 3, 1)), // March only
    });
    expect(trend).toHaveLength(1);
    expect(trend[0]).toMatchObject({ month: "2026-03", expenseMinor: 8000, incomeMinor: 0 });
  });
});

describe("lastNMonths", () => {
  it("returns n whole months ending with today's month", () => {
    const r = lastNMonths(6, new Date("2026-06-15T00:00:00Z"));
    expect(r.from.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(r.to.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });
});
