import { describe, it, expect } from "vitest";
import { db } from "../db";
import { summarize } from "./summary";

// TEST_PLAN §5 Analytics summarize gaps: amountMinor===0 -> income (absent from byCategory),
// all-income -> empty byCategory, multi-txn accumulation in one category.
const MARCH = { from: new Date("2026-03-01T00:00:00Z"), to: new Date("2026-04-01T00:00:00Z") };

async function acct() {
  return (await db.account.create({ data: { name: "A", type: "bank", currency: "EGP" } })).id;
}

async function tx(accountId: string, amountMinor: number, hash: string, categoryId?: string) {
  await db.transaction.create({
    data: {
      accountId,
      date: new Date("2026-03-10T00:00:00Z"),
      amountMinor,
      currency: "EGP",
      description: "x",
      source: "manual",
      categoryId,
      dedupeHash: hash,
    },
  });
}

describe("summarize — income/expense edge cases", () => {
  it("counts a zero-amount transaction as income and omits it from byCategory", async () => {
    const a = await acct();
    await tx(a, 0, "z");
    const s = await summarize(MARCH);
    expect(s).toMatchObject({ incomeMinor: 0, expenseMinor: 0, netMinor: 0, count: 1 });
    expect(s.byCategory).toEqual([]); // amountMinor >= 0 branch -> never bucketed by category
  });

  it("returns an empty byCategory when the month is all income", async () => {
    const a = await acct();
    await tx(a, 100000, "i1");
    await tx(a, 50000, "i2");
    const s = await summarize(MARCH);
    expect(s.incomeMinor).toBe(150000);
    expect(s.expenseMinor).toBe(0);
    expect(s.byCategory).toEqual([]);
  });

  it("accumulates multiple expenses in the same category", async () => {
    const a = await acct();
    const food = await db.category.create({ data: { name: "Food" } });
    await tx(a, -1000, "e1", food.id);
    await tx(a, -2500, "e2", food.id);
    const s = await summarize(MARCH);
    expect(s.expenseMinor).toBe(3500);
    expect(s.byCategory).toEqual([{ categoryId: food.id, name: "Food", expenseMinor: 3500 }]);
  });
});
