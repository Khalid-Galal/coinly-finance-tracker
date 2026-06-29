import Papa from "papaparse";
import type { BankStatementParser, ParsedRow } from "../types";
import { norm, toMinor, toIsoDate } from "./shared";

const REQUIRED = ["date", "amount", "description"];

/**
 * Generic CSV parser: any export with a single signed `amount` column plus date and
 * description (optional currency, payee). The fallback when no bank-specific parser
 * matches, and the template for bank-specific adapters.
 */
export const genericParser: BankStatementParser = {
  bank: "generic",

  canParse(headerLine: string): boolean {
    // Parse the header with Papa (not split(",")) so quoted field names — e.g. an
    // Excel/bank export of `"date","amount","description"` — have their quotes stripped
    // and still match the required columns.
    const cols = (Papa.parse<string[]>(headerLine).data[0] ?? []).map(norm);
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
