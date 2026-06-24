/** A single normalized transaction row produced by a bank-statement parser. */
export type ParsedRow = {
  date: string; // ISO YYYY-MM-DD
  amountMinor: number; // integer minor units; negative = expense, positive = income
  currency: string; // ISO 4217
  description: string;
  payee?: string;
  rawCsvRow: string; // original row, retained for audit/debugging
};

/**
 * Adapter for one bank's CSV statement format. Parsers are PURE — no DB access.
 * `canParse` sniffs the header line; `parse` returns normalized rows.
 */
export interface BankStatementParser {
  readonly bank: string;
  canParse(headerLine: string): boolean;
  parse(csvText: string): ParsedRow[];
}
