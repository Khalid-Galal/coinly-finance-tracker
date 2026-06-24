import { transactionRepository } from "@/lib/server/repositories/transactionRepository";
import { categoryRepository } from "@/lib/server/repositories/categoryRepository";
import { seedDefaultTaxonomy } from "@/lib/server/categories/seed";
import { TransactionsTable } from "./TransactionsTable";

// Reads the DB at request time — never prerendered at build (no DB in the build env).
export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  await seedDefaultTaxonomy();
  const [txns, categories] = await Promise.all([
    transactionRepository.list(),
    categoryRepository.list(),
  ]);

  const transactions = txns.map((t) => ({
    id: t.id,
    date: t.date.toISOString().slice(0, 10),
    description: t.description,
    categoryId: t.categoryId,
    categoryName: t.category?.name ?? null,
    amountMinor: t.amountMinor,
    currency: t.currency,
    source: t.source,
  }));

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Transactions</h1>
      <p>
        <a href="/dashboard">Dashboard</a> · <a href="/import">Import CSV</a> ·{" "}
        <a href="/quick-add">Add manually</a> · <a href="/accounts">Accounts</a>
      </p>
      {transactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <TransactionsTable
          transactions={transactions}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      )}
    </main>
  );
}
