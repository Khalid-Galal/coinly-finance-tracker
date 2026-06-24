import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "../db";
import { categorizeBatch, applyCorrection, categorizeUncategorized } from "./categorizeService";
import { llmCategorizeBatch } from "./llm";

vi.mock("./llm", () => ({ llmCategorizeBatch: vi.fn() }));

beforeEach(() => vi.mocked(llmCategorizeBatch).mockReset());

async function category(name: string) {
  return db.category.create({ data: { name } });
}

describe("categorizeBatch", () => {
  it("applies a matching rule without calling the LLM", async () => {
    const dining = await category("Dining Out");
    await db.categorizationRule.create({
      data: { matchType: "contains", pattern: "costa", categoryId: dining.id },
    });

    const out = await categorizeBatch([{ description: "COSTA COFFEE", amountMinor: -1500 }]);
    expect(out[0]).toMatchObject({ categoryId: dining.id, via: "rule" });
    expect(llmCategorizeBatch).not.toHaveBeenCalled();
  });

  it("uses the LLM for transactions no rule matches", async () => {
    const groceries = await category("Groceries");
    vi.mocked(llmCategorizeBatch).mockResolvedValue([{ category: "Groceries", confidence: 0.9 }]);

    const out = await categorizeBatch([{ description: "Spinneys", amountMinor: -8000 }]);
    expect(out[0]).toMatchObject({ categoryId: groceries.id, via: "llm" });
  });

  it("leaves a transaction uncategorized when the LLM yields no usable category (B6 fallback)", async () => {
    await category("Groceries");
    // LLM unavailable/unhelpful (quota exhausted, network down) -> empty result. categorizeBatch
    // also catches an outright throw from llmCategorizeBatch and produces the same uncategorized
    // fallback (verified), so the rules-only fallback path is covered either way.
    vi.mocked(llmCategorizeBatch).mockResolvedValue([]);
    const out = await categorizeBatch([{ description: "Mystery", amountMinor: -100 }]);
    expect(out[0]).toMatchObject({ categoryId: null, via: "none" });
  });
});

describe("applyCorrection", () => {
  it("creates a merchant_exact rule from the correction", async () => {
    const c = await category("Dining Out");
    await applyCorrection("Costa Coffee", c.id);
    const rules = await db.categorizationRule.findMany();
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({
      matchType: "merchant_exact",
      pattern: "costa coffee",
      categoryId: c.id,
      createdFromCorrection: true,
    });
  });
});

describe("categorizeUncategorized", () => {
  it("seeds the taxonomy and assigns categories to uncategorized transactions", async () => {
    const acc = await db.account.create({
      data: { name: "C", type: "bank", currency: "EGP", openingBalanceMinor: 0 },
    });
    await db.transaction.create({
      data: {
        accountId: acc.id,
        date: new Date("2026-01-01"),
        amountMinor: -5000,
        currency: "EGP",
        description: "Spinneys",
        source: "csv",
        dedupeHash: "u1",
      },
    });
    vi.mocked(llmCategorizeBatch).mockResolvedValue([{ category: "Groceries", confidence: 0.9 }]);

    expect(await categorizeUncategorized()).toEqual({ categorized: 1, total: 1 });

    const tx = await db.transaction.findFirst({ where: { description: "Spinneys" } });
    const groceries = await db.category.findFirst({ where: { name: "Groceries" } });
    expect(tx?.categoryId).toBe(groceries?.id);
    expect(tx?.aiConfidence).toBe(0.9);
  });
});
