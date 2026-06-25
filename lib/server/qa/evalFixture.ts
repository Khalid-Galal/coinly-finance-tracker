import { db } from "../db";

/**
 * A fixed, deterministic dataset for the Q&A evaluation set (US-F6). Every reference
 * query in evalSet.ts is answerable against exactly this data, so accuracy is reproducible.
 * Assumes an empty database (the test harness wipes before each test). Amounts are minor
 * units (1 EGP = 100); negative = expense, positive = income.
 */
export async function seedEvalFixture(): Promise<void> {
  const cib = await db.account.create({ data: { name: "CIB", type: "bank", currency: "EGP" } });
  const cash = await db.account.create({ data: { name: "Cash", type: "cash", currency: "EGP" } });

  const cats: Record<string, string> = {};
  for (const name of ["Dining", "Groceries", "Transport", "Salary", "Utilities", "Entertainment"]) {
    const c = await db.category.create({ data: { name } });
    cats[name] = c.id;
  }

  // [date, amountMinor, description, categoryName|null, accountId]
  const rows: [string, number, string, string | null, string][] = [
    ["2026-01-05", -5000, "Costa", "Dining", cib.id],
    ["2026-01-10", -20000, "Spinneys", "Groceries", cib.id],
    ["2026-01-15", -3000, "Uber", "Transport", cash.id],
    ["2026-01-28", 500000, "Salary", "Salary", cib.id],
    ["2026-02-03", -8000, "Dominos", "Dining", cib.id],
    ["2026-02-12", -25000, "Carrefour", "Groceries", cib.id],
    ["2026-02-20", -10000, "Electricity", "Utilities", cib.id],
    ["2026-02-28", 500000, "Salary", "Salary", cib.id],
    ["2026-03-04", -6000, "Starbucks", "Dining", cash.id],
    ["2026-03-09", -30000, "Spinneys", "Groceries", cib.id],
    ["2026-03-14", -4000, "Careem", "Transport", cash.id],
    ["2026-03-18", -15000, "Cinema", "Entertainment", cib.id],
    ["2026-03-25", -12000, "Water bill", "Utilities", cib.id],
    ["2026-03-29", 500000, "Salary", "Salary", cib.id],
    ["2026-04-02", -7000, "KFC", "Dining", cib.id],
    ["2026-04-08", -22000, "Carrefour", "Groceries", cib.id],
    ["2026-04-15", -2000, "Bus", "Transport", cash.id],
    ["2026-04-20", -9000, "Misc shop", null, cash.id],
  ];

  let i = 0;
  for (const [date, amountMinor, description, categoryName, accountId] of rows) {
    await db.transaction.create({
      data: {
        accountId,
        date: new Date(date),
        amountMinor,
        currency: "EGP",
        description,
        categoryId: categoryName ? cats[categoryName] : null,
        source: "manual",
        dedupeHash: `eval-${i++}`,
      },
    });
  }
}
