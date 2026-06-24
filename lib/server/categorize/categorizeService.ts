import { db } from "../db";
import { matchByRules } from "./rules";
import { llmCategorizeBatch, type LlmTx } from "./llm";
import { seedDefaultTaxonomy } from "../categories/seed";

export type CatAssignment = {
  index: number;
  categoryId: string | null;
  confidence: number;
  via: "rule" | "llm" | "none";
};

const LLM_BATCH = 20; // FR-2.4: ~1 LLM call per 20 transactions

/**
 * Categorize a batch of transactions: existing rules first, then a batched LLM call for
 * the remainder (chunked by 20). If the LLM is unavailable (quota/network), the
 * unmatched stay uncategorized — rules-only fallback (B6).
 */
export async function categorizeBatch(txs: LlmTx[]): Promise<CatAssignment[]> {
  const rules = await db.categorizationRule.findMany();
  const categories = await db.category.findMany({ where: { archivedAt: null } });
  const idByName = new Map(categories.map((c) => [c.name, c.id]));
  const leafNames = categories.map((c) => c.name);

  const results: CatAssignment[] = txs.map((_, index) => ({
    index,
    categoryId: null,
    confidence: 0,
    via: "none",
  }));

  const queue: { index: number; tx: LlmTx }[] = [];
  txs.forEach((tx, index) => {
    const hit = matchByRules(tx, rules);
    if (hit) results[index] = { index, categoryId: hit, confidence: 1, via: "rule" };
    else queue.push({ index, tx });
  });

  for (let i = 0; i < queue.length; i += LLM_BATCH) {
    const chunk = queue.slice(i, i + LLM_BATCH);
    try {
      const llm = await llmCategorizeBatch(
        chunk.map((q) => q.tx),
        leafNames,
      );
      chunk.forEach((q, j) => {
        const categoryId = idByName.get(llm[j]?.category ?? "") ?? null;
        results[q.index] = {
          index: q.index,
          categoryId,
          confidence: llm[j]?.confidence ?? 0,
          via: categoryId ? "llm" : "none",
        };
      });
    } catch {
      // LLM unavailable — leave this chunk uncategorized (rules-only fallback, B6)
    }
  }

  return results;
}

const MAX_PER_RUN = 200; // cap per run to bound LLM quota use

/** Seed the taxonomy if needed, then categorize all uncategorized transactions (rules-first). */
export async function categorizeUncategorized(): Promise<{ categorized: number; total: number }> {
  await seedDefaultTaxonomy();
  const pending = await db.transaction.findMany({
    where: { categoryId: null },
    orderBy: { date: "desc" },
    take: MAX_PER_RUN,
  });
  if (pending.length === 0) return { categorized: 0, total: 0 };

  const assignments = await categorizeBatch(
    pending.map((t) => ({
      description: t.description,
      payee: t.payee,
      amountMinor: t.amountMinor,
    })),
  );

  let categorized = 0;
  for (let i = 0; i < pending.length; i++) {
    const a = assignments[i];
    if (a?.categoryId) {
      await db.transaction.update({
        where: { id: pending[i].id },
        data: { categoryId: a.categoryId, aiConfidence: a.confidence },
      });
      categorized++;
    }
  }
  return { categorized, total: pending.length };
}

/** Learn from a user correction: a merchant_exact rule so future identical merchants skip the LLM (FR-2.6). */
export async function applyCorrection(description: string, categoryId: string): Promise<void> {
  await db.categorizationRule.create({
    data: {
      matchType: "merchant_exact",
      pattern: description.toLowerCase().trim(),
      categoryId,
      createdFromCorrection: true,
    },
  });
}
