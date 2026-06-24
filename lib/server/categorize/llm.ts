import { geminiGenerateText } from "../infra/geminiClient";

export type LlmTx = { description: string; payee?: string | null; amountMinor: number };
export type LlmCat = { category: string; confidence: number };

/**
 * Build a categorization prompt. Sends only merchant/description + amount (NFR-3.5:
 * no account numbers or raw CSV rows).
 */
export function buildCategorizationPrompt(txs: LlmTx[], categoryNames: string[]): string {
  const lines = txs
    .map(
      (t, i) =>
        `${i + 1}. ${t.description}${t.payee ? ` (${t.payee})` : ""} | ${(t.amountMinor / 100).toFixed(2)}`,
    )
    .join("\n");
  return [
    "You are a personal-finance transaction categorizer.",
    `Allowed categories: ${categoryNames.join(", ")}.`,
    "Assign each transaction to exactly one allowed category.",
    'Reply with ONLY a JSON array, one object per transaction in order: [{"category":"<allowed>","confidence":0..1}].',
    "Transactions:",
    lines,
  ].join("\n");
}

/** Parse the LLM reply; entries that are missing or not an allowed category become Uncategorized/0. */
export function parseCategorization(
  text: string,
  count: number,
  categoryNames: string[],
): LlmCat[] {
  const allowed = new Set(categoryNames);
  let parsed: unknown = [];
  try {
    parsed = JSON.parse(text.replace(/```json|```/gi, "").trim());
  } catch {
    parsed = [];
  }
  const list = Array.isArray(parsed) ? parsed : [];
  const out: LlmCat[] = [];
  for (let i = 0; i < count; i++) {
    const e = list[i] as { category?: unknown; confidence?: unknown } | undefined;
    const category =
      typeof e?.category === "string" && allowed.has(e.category) ? e.category : "Uncategorized";
    const confidence =
      typeof e?.confidence === "number" ? Math.max(0, Math.min(1, e.confidence)) : 0;
    out.push({ category, confidence });
  }
  return out;
}

export async function llmCategorizeBatch(txs: LlmTx[], categoryNames: string[]): Promise<LlmCat[]> {
  if (txs.length === 0) return [];
  const text = await geminiGenerateText(buildCategorizationPrompt(txs, categoryNames));
  return parseCategorization(text, txs.length, categoryNames);
}
