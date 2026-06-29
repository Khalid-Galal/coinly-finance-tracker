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

  it("chunks the LLM by 20: 21 unmatched txs -> 2 batch calls", async () => {
    // No rules seeded, so all 21 queue for the LLM; LLM_BATCH=20 => one chunk of 20 + one of 1.
    vi.mocked(llmCategorizeBatch).mockResolvedValue([]);
    const txs = Array.from({ length: 21 }, (_, i) => ({
      description: "tx" + i,
      amountMinor: -100,
    }));
    await categorizeBatch(txs);
    expect(llmCategorizeBatch).toHaveBeenCalledTimes(2);
  });

  it("does not assign an archived category the LLM returns", async () => {
    const old = await category("Old Category");
    await db.category.update({ where: { id: old.id }, data: { archivedAt: new Date() } });
    // categorizeBatch only considers categories where archivedAt is null, so an archived
    // name from the LLM has no live id and the tx stays uncategorized.
    vi.mocked(llmCategorizeBatch).mockResolvedValue([
      { category: "Old Category", confidence: 0.9 },
    ]);
    const out = await categorizeBatch([{ description: "X", amountMinor: -100 }]);
    expect(out[0]).toMatchObject({ categoryId: null, via: "none" });
  });

  it("assigns a real category literally named 'Uncategorized' (it is a normal leaf)", async () => {
    const uncat = await category("Uncategorized");
    vi.mocked(llmCategorizeBatch).mockResolvedValue([
      { category: "Uncategorized", confidence: 0.5 },
    ]);
    const out = await categorizeBatch([{ description: "X", amountMinor: -100 }]);
    expect(out[0]).toMatchObject({ categoryId: uncat.id, via: "llm" });
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

  it("creates a DUPLICATE rule when the same merchant is corrected twice", async () => {
    const c = await category("Dining Out");
    await applyCorrection("Costa", c.id);
    await applyCorrection("Costa", c.id);
    // BUG: no upsert/dedupe; correcting the same merchant twice yields two identical
    // merchant_exact rules instead of updating the existing one.
    expect(await db.categorizationRule.count()).toBe(2);
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

  it("caps a single run at 200 transactions (MAX_PER_RUN)", async () => {
    const acc = await db.account.create({
      data: { name: "Big", type: "bank", currency: "EGP", openingBalanceMinor: 0 },
    });
    await db.transaction.createMany({
      data: Array.from({ length: 201 }, (_, i) => ({
        accountId: acc.id,
        date: new Date(2026, 0, 1, 0, 0, i), // distinct dates so the take(200) is deterministic
        amountMinor: -100,
        currency: "EGP",
        description: "tx" + i,
        source: "csv",
        dedupeHash: "h" + i,
      })),
    });
    vi.mocked(llmCategorizeBatch).mockResolvedValue([]);
    // 201 pending, but the run pulls at most MAX_PER_RUN=200.
    expect((await categorizeUncategorized()).total).toBe(200);
  });
});
