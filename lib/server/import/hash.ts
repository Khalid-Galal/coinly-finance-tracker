import { createHash } from "node:crypto";

/**
 * Stable dedupe key for a transaction: SHA-256 of date|amountMinor|description|accountId.
 * Used to make CSV re-imports idempotent (also enforced by a unique index on the column).
 */
export function dedupeHash(
  r: { date: string; amountMinor: number; description: string },
  accountId: string,
): string {
  return createHash("sha256")
    .update(`${r.date}|${r.amountMinor}|${r.description}|${accountId}`)
    .digest("hex");
}
