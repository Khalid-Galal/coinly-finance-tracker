/** Normalize a header/key: trim + lowercase. */
export const norm = (s: string): string => s.trim().toLowerCase();

/** "1,234.50" | "-2000" | "" -> integer minor units (×100, rounded). Blank -> 0. */
export function toMinor(amount: string): number {
  const n = parseFloat(String(amount).replace(/,/g, "").trim());
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Accept ISO (YYYY-MM-DD) or DD/MM/YYYY (Egyptian convention) -> ISO. */
export function toIsoDate(d: string): string {
  const s = d.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return s; // leave as-is; downstream validation catches bad dates
}

/** First non-empty value among the given header aliases (already-normalized keys). */
export function pickField(row: Record<string, string>, aliases: string[]): string | undefined {
  for (const a of aliases) {
    const v = row[a];
    if (v !== undefined && v.trim() !== "") return v;
  }
  return undefined;
}

/** Does the (normalized) header column list contain any of these aliases? */
export function hasColumn(cols: string[], aliases: string[]): boolean {
  return aliases.some((a) => cols.includes(a));
}
