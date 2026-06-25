import { db } from "../db";
import { summarize } from "../analytics/summary";

export type BudgetStatus = "ok" | "warning" | "over";

export type BudgetProgress = {
  id: string;
  categoryId: string;
  categoryName: string;
  budgetMinor: number;
  spentMinor: number;
  pct: number; // spent / budget; can exceed 1 when over budget
  status: BudgetStatus;
};

/** Half-open [from, to) UTC bounds for a 'YYYY-MM' month. Date.UTC rolls the year over for Dec. */
export function monthRange(month: string): { from: Date; to: Date } {
  const [y, m] = month.split("-").map(Number);
  return { from: new Date(Date.UTC(y, m - 1, 1)), to: new Date(Date.UTC(y, m, 1)) };
}

// US-E3: warn before the limit, flag when reached. 80% is the conventional "approaching" line.
function statusOf(pct: number): BudgetStatus {
  if (pct >= 1) return "over";
  if (pct >= 0.8) return "warning";
  return "ok";
}

/** Set (or update) the budget for a category in a month — idempotent on (categoryId, month). */
export function setBudget(input: {
  categoryId: string;
  month: string;
  amountMinor: number;
  currency: string;
}) {
  return db.budget.upsert({
    where: { categoryId_month: { categoryId: input.categoryId, month: input.month } },
    create: input,
    update: { amountMinor: input.amountMinor, currency: input.currency },
  });
}

export async function removeBudget(id: string): Promise<void> {
  await db.budget.delete({ where: { id } });
}

/** Each budget for the month with its actual spend, percentage used, and warning status. */
export async function getBudgetProgress(month: string): Promise<BudgetProgress[]> {
  const budgets = await db.budget.findMany({
    where: { month },
    include: { category: { select: { name: true } } },
  });
  if (budgets.length === 0) return [];

  const summary = await summarize(monthRange(month));
  const spentByCategory = new Map(summary.byCategory.map((c) => [c.categoryId, c.expenseMinor]));

  return budgets
    .map((b) => {
      const spentMinor = spentByCategory.get(b.categoryId) ?? 0;
      const pct = b.amountMinor > 0 ? spentMinor / b.amountMinor : 0;
      return {
        id: b.id,
        categoryId: b.categoryId,
        categoryName: b.category.name,
        budgetMinor: b.amountMinor,
        spentMinor,
        pct,
        status: statusOf(pct),
      };
    })
    .sort((a, b) => b.pct - a.pct);
}
