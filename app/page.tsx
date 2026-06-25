import { db } from "@/lib/server/db";

// Reads the DB to decide whether to show the first-run wizard prompt (US-G1).
export const dynamic = "force-dynamic";

export default async function Home() {
  const firstRun = (await db.account.count()) === 0;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Coinly</h1>
      <p>Self-hosted personal finance tracker.</p>

      {firstRun && (
        <section
          style={{
            background: "#eef6ff",
            border: "1px solid #bcd9f5",
            borderRadius: 8,
            padding: 16,
            margin: "16px 0",
          }}
        >
          <strong>👋 Welcome!</strong> It looks like this is a fresh install. Let&apos;s set up your
          currency and first account.
          <p style={{ margin: "8px 0 0" }}>
            <a href="/welcome">Start setup →</a>
          </p>
        </section>
      )}

      <ul>
        <li>
          <a href="/dashboard">Dashboard</a>
        </li>
        <li>
          <a href="/transactions">Transactions</a>
        </li>
        <li>
          <a href="/import">Import CSV</a>
        </li>
        <li>
          <a href="/quick-add">Add transaction</a>
        </li>
        <li>
          <a href="/accounts">Accounts</a>
        </li>
        <li>
          <a href="/budgets">Budgets</a>
        </li>
        <li>
          <a href="/insights">Insights</a>
        </li>
        <li>
          <a href="/ask">Ask Coinly</a>
        </li>
        <li>
          <a href="/settings">Settings</a>
        </li>
      </ul>
      <p style={{ color: "#666", fontSize: 13 }}>
        Health: <a href="/api/health">/api/health</a>
      </p>
    </main>
  );
}
