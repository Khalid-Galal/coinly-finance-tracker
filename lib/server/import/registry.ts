import type { BankStatementParser } from "./types";
import { genericParser } from "./parsers/generic";

// Most specific first; the generic parser is the fallback. Bank-specific
// parsers (CIB, Banque Misr, NBE) are unshifted ahead of generic as they are added.
const parsers: BankStatementParser[] = [genericParser];

export function pickParser(headerLine: string): BankStatementParser | undefined {
  return parsers.find((p) => p.canParse(headerLine));
}

export function registerParser(p: BankStatementParser): void {
  parsers.unshift(p);
}
