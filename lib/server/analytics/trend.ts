import { db } from "../db";
import type { DateRange } from "./dateRange";

export type TrendPoint = {
  month: string; // 'YYYY-MM'
  incomeMinor: number;
  expenseMinor: number; // positive
  netMinor: number;
};

const monthKey = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

/**
 * Income/expense/net per month across a range (US-C3). Every month in the range gets a row —
 * months with no transactions appear as zeros so the trend line has no gaps.
 * ponytail: single-currency sum like summarize(); multi-currency conversion is Sprint 5.
 */
export async function monthlyTrend(range: DateRange): Promise<TrendPoint[]> {
  const buckets = new Map<string, { income: number; expense: number }>();
  for (
    let d = new Date(Date.UTC(range.from.getUTCFullYear(), range.from.getUTCMonth(), 1));
    d < range.to;
    d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
  ) {
    buckets.set(monthKey(d), { income: 0, expense: 0 });
  }

  const txns = await db.transaction.findMany({
    where: { date: { gte: range.from, lt: range.to } },
    select: { date: true, amountMinor: true },
  });
  for (const t of txns) {
    const b = buckets.get(monthKey(t.date)) ?? { income: 0, expense: 0 };
    if (t.amountMinor >= 0) b.income += t.amountMinor;
    else b.expense += -t.amountMinor;
    buckets.set(monthKey(t.date), b);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, b]) => ({
      month,
      incomeMinor: b.income,
      expenseMinor: b.expense,
      netMinor: b.income - b.expense,
    }));
}
