import { db } from "../db";
import { pickParser } from "./registry";
import { dedupeHash } from "./hash";

export type ImportResult = { imported: number; skipped: number };

/** Strip a leading UTF-8 BOM (Excel and many bank CSV exports include one). */
function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/**
 * Import pipeline: parse (via registry) -> hash -> drop rows already in the DB ->
 * drop within-file duplicates -> persist. Idempotent: re-importing the same file
 * imports nothing new. The unique index on dedupeHash is the final safety net.
 */
export async function importCsv(csvText: string, accountId: string): Promise<ImportResult> {
  const text = stripBom(csvText);
  const headerLine = text.split(/\r?\n/, 1)[0] ?? "";
  const parser = pickParser(headerLine);
  if (!parser) throw new Error("Unsupported CSV format");

  const rows = parser.parse(text);
  const withHash = rows.map((row) => ({
    row,
    hash: dedupeHash(
      { date: row.date, amountMinor: row.amountMinor, description: row.description },
      accountId,
    ),
  }));

  const existing = await db.transaction.findMany({
    where: { dedupeHash: { in: withHash.map((w) => w.hash) } },
    select: { dedupeHash: true },
  });
  const known = new Set(existing.map((e) => e.dedupeHash));

  const toInsert: typeof withHash = [];
  const seen = new Set<string>();
  for (const w of withHash) {
    if (known.has(w.hash) || seen.has(w.hash)) continue;
    seen.add(w.hash);
    toInsert.push(w);
  }

  for (const w of toInsert) {
    await db.transaction.create({
      data: {
        accountId,
        date: new Date(w.row.date),
        amountMinor: w.row.amountMinor,
        currency: w.row.currency,
        description: w.row.description,
        payee: w.row.payee,
        source: "csv",
        rawCsvRow: w.row.rawCsvRow,
        dedupeHash: w.hash,
      },
    });
  }

  return { imported: toInsert.length, skipped: rows.length - toInsert.length };
}
