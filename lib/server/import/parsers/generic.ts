import Papa from "papaparse";
import type { BankStatementParser, ParsedRow } from "../types";

const REQUIRED = ["date", "amount", "description"];

const norm = (s: string): string => s.trim().toLowerCase();

/** "1,234.50" | "-2000" -> integer minor units (×100, rounded). */
function toMinor(amount: string): number {
  const n = parseFloat(String(amount).replace(/,/g, "").trim());
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Accept ISO (YYYY-MM-DD) or DD/MM/YYYY (Egyptian convention) -> ISO. */
function toIsoDate(d: string): string {
  const s = d.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return s; // leave as-is; downstream validation catches bad dates
}

/**
 * Generic CSV parser: any export with date, amount, description columns
 * (optional currency, payee). The fallback when no bank-specific parser matches,
 * and the template for bank-specific adapters.
 */
export const genericParser: BankStatementParser = {
  bank: "generic",

  canParse(headerLine: string): boolean {
    const cols = headerLine.split(",").map(norm);
    return REQUIRED.every((r) => cols.includes(r));
  },

  parse(csvText: string): ParsedRow[] {
    const { data } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: norm,
    });
    return data.map((row) => ({
      date: toIsoDate(row.date ?? ""),
      amountMinor: toMinor(row.amount ?? "0"),
      currency: (row.currency ?? "EGP").trim().toUpperCase() || "EGP",
      description: (row.description ?? "").trim(),
      payee: row.payee?.trim() || undefined,
      rawCsvRow: JSON.stringify(row),
    }));
  },
};
