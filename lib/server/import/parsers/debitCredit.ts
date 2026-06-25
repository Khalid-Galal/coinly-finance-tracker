import Papa from "papaparse";
import type { BankStatementParser, ParsedRow } from "../types";
import { norm, toMinor, toIsoDate, pickField, hasColumn } from "./shared";

/**
 * Debit/Credit columns parser (US-A3/A4). Egyptian banks — CIB, Banque Misr, NBE — export
 * statements with SEPARATE "Debit" (money out) and "Credit" (money in) columns rather than one
 * signed amount, which the generic parser can't read. Column NAMES vary between banks and between
 * a bank's own English/Arabic exports, so the aliases below are deliberately broad and live in one
 * place — add a bank's exact header here if its export uses an unlisted name.
 *
 * Convention: a value in the debit column reduces the balance (negative); credit increases it
 * (positive). Magnitudes are used, so it works whether a bank writes debits as positive or negative.
 */
const ALIASES = {
  date: ["date", "transaction date", "trans date", "txn date", "value date", "posting date"],
  debit: [
    "debit",
    "withdrawal",
    "withdrawals",
    "money out",
    "dr",
    "debit amount",
    "withdrawal amount",
  ],
  credit: ["credit", "deposit", "deposits", "money in", "cr", "credit amount", "deposit amount"],
  description: [
    "description",
    "narrative",
    "narration",
    "details",
    "transaction details",
    "particulars",
    "remarks",
    "memo",
  ],
  currency: ["currency", "ccy"],
  payee: ["payee", "beneficiary", "merchant"],
};

export const debitCreditParser: BankStatementParser = {
  bank: "debit-credit",

  // Claims any export that has a date column AND both a debit and a credit column. This is
  // complementary to the generic parser, which requires a single `amount` column.
  canParse(headerLine: string): boolean {
    const cols = headerLine.split(",").map(norm);
    return (
      hasColumn(cols, ALIASES.date) &&
      hasColumn(cols, ALIASES.debit) &&
      hasColumn(cols, ALIASES.credit)
    );
  },

  parse(csvText: string): ParsedRow[] {
    const { data } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: norm,
    });

    return (
      data
        .map((row): ParsedRow => {
          const debit = pickField(row, ALIASES.debit);
          const credit = pickField(row, ALIASES.credit);
          const amountMinor =
            (debit ? -Math.abs(toMinor(debit)) : 0) + (credit ? Math.abs(toMinor(credit)) : 0);
          return {
            date: toIsoDate(pickField(row, ALIASES.date) ?? ""),
            amountMinor,
            currency: (pickField(row, ALIASES.currency) ?? "EGP").trim().toUpperCase() || "EGP",
            description: (pickField(row, ALIASES.description) ?? "").trim(),
            payee: pickField(row, ALIASES.payee)?.trim() || undefined,
            rawCsvRow: JSON.stringify(row),
          };
        })
        // Drop trailing summary/blank lines (no date, and no money movement).
        .filter((r) => r.date !== "" && (r.amountMinor !== 0 || r.description !== ""))
    );
  },
};
