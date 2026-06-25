import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db";
import { setBudget, getBudgetProgress, removeBudget, monthRange } from "./budgetService";

let accountId = "";
let dining = "";
let groceries = "";
let transport = "";

beforeEach(async () => {
  const acc = await db.account.create({ data: { name: "Main", type: "bank", currency: "EGP" } });
  accountId = acc.id;
  dining = (await db.category.create({ data: { name: "Dining" } })).id;
  groceries = (await db.category.create({ data: { name: "Groceries" } })).id;
  transport = (await db.category.create({ data: { name: "Transport" } })).id;
  // March 2026 spend: Dining 80.00, Groceries 300.00, Transport 0.
  const txns = [
    { categoryId: dining, amountMinor: -5000 },
    { categoryId: dining, amountMinor: -3000 },
    { categoryId: groceries, amountMinor: -30000 },
  ];
  let i = 0;
  for (const t of txns) {
    await db.transaction.create({
      data: {
        accountId,
        date: new Date("2026-03-15"),
        currency: "EGP",
        description: "x",
        source: "manual",
        dedupeHash: `b-${i++}`,
        ...t,
      },
    });
  }
});

describe("monthRange", () => {
  it("returns half-open UTC bounds and rolls the year over for December", () => {
    const r = monthRange("2026-12");
    expect(r.from.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(r.to.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("setBudget", () => {
  it("is idempotent on (category, month) — a second set updates, not duplicates", async () => {
    await setBudget({ categoryId: dining, month: "2026-03", amountMinor: 10000, currency: "EGP" });
    await setBudget({ categoryId: dining, month: "2026-03", amountMinor: 20000, currency: "EGP" });
    const all = await db.budget.findMany({ where: { categoryId: dining, month: "2026-03" } });
    expect(all).toHaveLength(1);
    expect(all[0].amountMinor).toBe(20000);
  });
});

describe("getBudgetProgress", () => {
  it("returns [] when no budgets are set", async () => {
    expect(await getBudgetProgress("2026-03")).toEqual([]);
  });

  it("computes spend, percentage, and status per budget", async () => {
    await setBudget({ categoryId: dining, month: "2026-03", amountMinor: 10000, currency: "EGP" }); // 80% -> warning
    await setBudget({
      categoryId: groceries,
      month: "2026-03",
      amountMinor: 20000,
      currency: "EGP",
    }); // 150% -> over
    await setBudget({
      categoryId: transport,
      month: "2026-03",
      amountMinor: 5000,
      currency: "EGP",
    }); // 0% -> ok

    const progress = await getBudgetProgress("2026-03");
    const byCat = Object.fromEntries(progress.map((p) => [p.categoryName, p]));

    expect(byCat.Dining).toMatchObject({ spentMinor: 8000, budgetMinor: 10000, status: "warning" });
    expect(byCat.Groceries).toMatchObject({ spentMinor: 30000, status: "over" });
    expect(byCat.Transport).toMatchObject({ spentMinor: 0, status: "ok" });
    // Sorted most-used first.
    expect(progress[0].categoryName).toBe("Groceries");
  });

  it("ignores spend outside the budget month", async () => {
    await setBudget({ categoryId: dining, month: "2026-04", amountMinor: 10000, currency: "EGP" });
    const progress = await getBudgetProgress("2026-04");
    expect(progress[0].spentMinor).toBe(0); // the Dining spend was in March
  });
});

describe("removeBudget", () => {
  it("deletes a budget", async () => {
    const b = await setBudget({
      categoryId: dining,
      month: "2026-03",
      amountMinor: 10000,
      currency: "EGP",
    });
    await removeBudget(b.id);
    expect(await db.budget.count()).toBe(0);
  });
});
