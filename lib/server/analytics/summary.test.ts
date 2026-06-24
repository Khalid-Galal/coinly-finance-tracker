import { describe, it, expect } from "vitest";
import { db } from "../db";
import { summarize } from "./summary";

async function account() {
  return db.account.create({
    data: { name: "Cash", type: "cash", currency: "EGP", openingBalanceMinor: 0 },
  });
}

async function tx(accountId: string, date: string, amountMinor: number) {
  await db.transaction.create({
    data: {
      accountId,
      date: new Date(date),
      amountMinor,
      currency: "EGP",
      description: `t${amountMinor}`,
      source: "manual",
      dedupeHash: `${date}|${amountMinor}|${accountId}`,
    },
  });
}

describe("summarize", () => {
  it("totals income, expense, and net within the range only", async () => {
    const acc = await account();
    await tx(acc.id, "2026-03-05", 100000); // income, in range
    await tx(acc.id, "2026-03-20", -40000); // expense, in range
    await tx(acc.id, "2026-02-28", -99999); // out of range (before)

    const s = await summarize({ from: new Date("2026-03-01"), to: new Date("2026-04-01") });
    expect(s.incomeMinor).toBe(100000);
    expect(s.expenseMinor).toBe(40000);
    expect(s.netMinor).toBe(60000);
    expect(s.count).toBe(2);
  });

  it("groups expenses by category (sorted desc, uncategorized labeled)", async () => {
    const acc = await account();
    const food = await db.category.create({ data: { name: "Food" } });
    await db.transaction.create({
      data: {
        accountId: acc.id,
        date: new Date("2026-03-06"),
        amountMinor: -3000,
        currency: "EGP",
        description: "groceries",
        source: "manual",
        categoryId: food.id,
        dedupeHash: "bc1",
      },
    });
    await db.transaction.create({
      data: {
        accountId: acc.id,
        date: new Date("2026-03-07"),
        amountMinor: -2000,
        currency: "EGP",
        description: "mystery",
        source: "manual",
        dedupeHash: "bc2",
      },
    });

    const s = await summarize({ from: new Date("2026-03-01"), to: new Date("2026-04-01") });
    expect(s.byCategory).toEqual([
      { categoryId: food.id, name: "Food", expenseMinor: 3000 },
      { categoryId: null, name: "Uncategorized", expenseMinor: 2000 },
    ]);
  });
});
