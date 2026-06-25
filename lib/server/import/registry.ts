import type { BankStatementParser } from "./types";
import { genericParser } from "./parsers/generic";
import { debitCreditParser } from "./parsers/debitCredit";

// Most specific first; the generic parser is the fallback. The debit/credit parser handles the
// two-column format Egyptian banks (CIB, Banque Misr, NBE) export; generic handles single-column
// signed-amount CSVs. They claim disjoint header shapes, so order only matters for the fallback.
const parsers: BankStatementParser[] = [debitCreditParser, genericParser];

export function pickParser(headerLine: string): BankStatementParser | undefined {
  return parsers.find((p) => p.canParse(headerLine));
}

export function registerParser(p: BankStatementParser): void {
  parsers.unshift(p);
}
