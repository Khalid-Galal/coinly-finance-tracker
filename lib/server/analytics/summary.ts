import { db } from "../db";
import type { DateRange } from "./dateRange";

export type Summary = {
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
  count: number;
};

/**
 * Income/expense/net totals over a date range.
 * ponytail: sums raw amountMinor (single-currency assumption — fine for EGP-only).
 * Multi-currency aggregation needs the base-currency setting + per-row conversion;
 * deferred until the Settings/base-currency story (Sprint 5).
 */
export async function summarize(range: DateRange): Promise<Summary> {
  const txns = await db.transaction.findMany({
    where: { date: { gte: range.from, lt: range.to } },
    select: { amountMinor: true },
  });

  let income = 0;
  let expense = 0;
  for (const t of txns) {
    if (t.amountMinor >= 0) income += t.amountMinor;
    else expense += -t.amountMinor;
  }
  return {
    incomeMinor: income,
    expenseMinor: expense,
    netMinor: income - expense,
    count: txns.length,
  };
}
