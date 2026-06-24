export type Rule = { matchType: string; pattern: string; categoryId: string };
export type RuleTx = { description: string; payee?: string | null };

/** Return the categoryId of the first matching rule, else null. */
export function matchByRules(tx: RuleTx, rules: Rule[]): string | null {
  const hay = `${tx.description} ${tx.payee ?? ""}`.toLowerCase();
  for (const r of rules) {
    const pat = r.pattern.toLowerCase();
    const hit =
      r.matchType === "merchant_exact"
        ? tx.description.toLowerCase().trim() === pat
        : hay.includes(pat);
    if (hit) return r.categoryId;
  }
  return null;
}
