export type DateRange = { from: Date; to: Date };
export type RangePreset = "this-month" | "last-month" | "last-3-months" | "ytd";

export const RANGE_PRESETS: readonly RangePreset[] = [
  "this-month",
  "last-month",
  "last-3-months",
  "ytd",
];

const startOfMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 1));

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
