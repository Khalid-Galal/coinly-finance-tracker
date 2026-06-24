import { db } from "../db";
import type { DateRange } from "./dateRange";

export type CategoryTotal = { categoryId: string | null; name: string; expenseMinor: number };
export type Summary = {
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
  count: number;
  byCategory: CategoryTotal[];
};

/**
 * Income/expense/net + expense-by-category over a date range.
 * ponytail: sums raw amountMinor (single-currency assumption — fine for EGP-only).
 * Multi-currency aggregation needs the base-currency setting + per-row conversion (Sprint 5).
 */
export async function summarize(range: DateRange): Promise<Summary> {
  const txns = await db.transaction.findMany({
    where: { date: { gte: range.from, lt: range.to } },
    select: { amountMinor: true, categoryId: true, category: { select: { name: true } } },
  });

  let income = 0;
  let expense = 0;
  const cats = new Map<string, CategoryTotal>();
  for (const t of txns) {
    if (t.amountMinor >= 0) {
      income += t.amountMinor;
      continue;
    }
    const amt = -t.amountMinor;
    expense += amt;
    const key = t.categoryId ?? "__none__";
    const entry = cats.get(key) ?? {
      categoryId: t.categoryId ?? null,
      name: t.category?.name ?? "Uncategorized",
      expenseMinor: 0,
    };
    entry.expenseMinor += amt;
    cats.set(key, entry);
  }

  return {
    incomeMinor: income,
    expenseMinor: expense,
    netMinor: income - expense,
    count: txns.length,
    byCategory: [...cats.values()].sort((a, b) => b.expenseMinor - a.expenseMinor),
  };
}
