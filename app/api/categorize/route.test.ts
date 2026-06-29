import { describe, it, expect } from "vitest";
import { POST } from "./route";
import { db } from "@/lib/server/db";

describe("POST /api/categorize", () => {
  it("returns {categorized:0, total:0} when there are no pending transactions", async () => {
    const r = await POST();
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ categorized: 0, total: 0 });
  });

  it("categorizes a rule-matched pending txn without calling the LLM", async () => {
    const account = await db.account.create({
      data: { name: "CIB Checking", type: "bank", currency: "EGP", openingBalanceMinor: 0 },
    });
    // Create the category first so seedDefaultTaxonomy() is a no-op (active category exists).
    const cat = await db.category.create({ data: { name: "Dining" } });
    await db.categorizationRule.create({
      data: { matchType: "contains", pattern: "costa", categoryId: cat.id },
    });
    const txn = await db.transaction.create({
      data: {
        accountId: account.id,
        date: new Date(),
        description: "COSTA COFFEE",
        source: "csv",
        currency: "EGP",
        amountMinor: -1500,
        dedupeHash: "x1",
        categoryId: null,
      },
    });

    const r = await POST();
    expect(r.status).toBe(200);
    // Rule match => via "rule", so the real Gemini LLM is never invoked.
    expect(await r.json()).toEqual({ categorized: 1, total: 1 });

    const updated = await db.transaction.findUnique({ where: { id: txn.id } });
    expect(updated?.categoryId).toBe(cat.id);
  });
});
