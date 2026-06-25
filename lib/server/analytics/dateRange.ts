export type DateRange = { from: Date; to: Date };
export type RangePreset = "this-month" | "last-month" | "last-3-months" | "ytd";

export const RANGE_PRESETS: readonly RangePreset[] = [
  "this-month",
  "last-month",
  "last-3-months",
  "ytd",
];

const startOfMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 1));

/** Half-open [from, to) bounds covering the last `n` whole months ending with `today`'s month. */
export function lastNMonths(n: number, today: Date): DateRange {
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  return { from: startOfMonth(y, m - (n - 1)), to: startOfMonth(y, m + 1) };
}

/** 'YYYY-MM' for a date (UTC). */
export const monthKeyOf = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

/** Half-open [from, to) UTC bounds for a 'YYYY-MM' month. Date.UTC rolls the year over for Dec. */
export function monthRange(month: string): DateRange {
  const [y, m] = month.split("-").map(Number);
  return { from: startOfMonth(y, m - 1), to: startOfMonth(y, m) };
}

/** Shift a 'YYYY-MM' month by `delta` months (negative = earlier). */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  return monthKeyOf(startOfMonth(y, m - 1 + delta));
}

/** Half-open [from, to) bounds for the trailing `n` calendar days ending today (UTC). */
export function trailingDays(n: number, today: Date): DateRange {
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return {
    from: new Date(start.getTime() - (n - 1) * 86_400_000),
    to: new Date(start.getTime() + 86_400_000),
  };
}

/** Resolve a named range to half-open [from, to) bounds relative to `today` (UTC). */
export function resolveRange(preset: RangePreset, today: Date): DateRange {
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  switch (preset) {
    case "this-month":
      return { from: startOfMonth(y, m), to: startOfMonth(y, m + 1) };
    case "last-month":
      return { from: startOfMonth(y, m - 1), to: startOfMonth(y, m) };
    case "last-3-months":
      return { from: startOfMonth(y, m - 2), to: startOfMonth(y, m + 1) };
    case "ytd":
      return { from: startOfMonth(y, 0), to: startOfMonth(y, m + 1) };
  }
}
