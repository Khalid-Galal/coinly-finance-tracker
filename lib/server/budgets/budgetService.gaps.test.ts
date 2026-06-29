import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db";
import { setBudget, getBudgetProgress, removeBudget } from "./budgetService";

// TEST_PLAN §5 Budgets gaps: removeBudget unknown id (P2025), setBudget bad-category FK,
// exact statusOf boundary (0.8 warning, 1.0 over), income-only month -> 0 spend.
let accountId = "";

beforeEach(async () => {
  accountId = (await db.account.create({ data: { name: "A", type: "bank", currency: "EGP" } })).id;
});

async function cat(name: string) {
  return (await db.category.create({ data: { name } })).id;
}

async function spend(categoryId: string, amountMinor: number, hash: string) {
  await db.transaction.create({
    data: {
      accountId,
      date: new Date("2026-05-15T00:00:00Z"),
      amountMinor,
      currency: "EGP",
      description: "x",
      source: "manual",
      categoryId,
      dedupeHash: hash,
    },
  });
}

describe("setBudget — bad category", () => {
  it("rejects a non-existent categoryId (foreign-key violation)", async () => {
    await expect(
      setBudget({ categoryId: "ghost", month: "2026-05", amountMinor: 5000, currency: "EGP" }),
    ).rejects.toThrow();
  });
});

describe("removeBudget — unknown id", () => {
  it("throws Prisma P2025 (the route surfaces this as 500, not 404)", async () => {
    await expect(removeBudget("nope")).rejects.toMatchObject({ code: "P2025" });
  });
});

describe("getBudgetProgress — status thresholds", () => {
  it("classifies <0.8 ok, exactly 0.8 warning, and >=1.0 over", async () => {
    const ok = await cat("OkCat");
    const warn = await cat("WarnCat");
    const over = await cat("OverCat");
    await spend(ok, -7900, "s-ok"); // 7900/10000 = 0.79 -> ok
    await spend(warn, -8000, "s-warn"); // 8000/10000 = 0.80 -> warning (>= 0.8)
    await spend(over, -5000, "s-over"); // 5000/5000  = 1.00 -> over (>= 1)
    await setBudget({ categoryId: ok, month: "2026-05", amountMinor: 10000, currency: "EGP" });
    await setBudget({ categoryId: warn, month: "2026-05", amountMinor: 10000, currency: "EGP" });
    await setBudget({ categoryId: over, month: "2026-05", amountMinor: 5000, currency: "EGP" });

    const byCat = Object.fromEntries(
      (await getBudgetProgress("2026-05")).map((p) => [p.categoryName, p]),
    );
    expect(byCat.OkCat.status).toBe("ok");
    expect(byCat.OkCat.pct).toBeCloseTo(0.79, 5);
    expect(byCat.WarnCat.status).toBe("warning");
    expect(byCat.WarnCat.pct).toBeCloseTo(0.8, 5);
    expect(byCat.OverCat.status).toBe("over");
    expect(byCat.OverCat.pct).toBe(1);
  });

  it("treats an income-only category as zero spend (status ok)", async () => {
    const salary = await cat("Salary");
    await spend(salary, 500000, "inc"); // positive -> income, never an expense
    await setBudget({ categoryId: salary, month: "2026-05", amountMinor: 10000, currency: "EGP" });
    const [p] = await getBudgetProgress("2026-05");
    expect(p).toMatchObject({ categoryName: "Salary", spentMinor: 0, pct: 0, status: "ok" });
  });
});
