import { transactionRepository } from "@/lib/server/repositories/transactionRepository";

// Reads the DB at request time — never prerendered at build (no DB in the build env).
export const dynamic = "force-dynamic";

function formatMinor(minor: number, currency: string): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export default async function TransactionsPage() {
  const txns = await transactionRepository.list();
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Transactions</h1>
      <p>
        <a href="/import">Import CSV</a> · <a href="/quick-add">Add manually</a> ·{" "}
        <a href="/accounts">Accounts</a>
      </p>
      {txns.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <table border={1} cellPadding={6} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t.id}>
                <td>{t.date.toISOString().slice(0, 10)}</td>
                <td>{t.description}</td>
                <td style={{ textAlign: "right" }}>{formatMinor(t.amountMinor, t.currency)}</td>
                <td>{t.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
