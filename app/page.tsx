export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Coinly</h1>
      <p>Self-hosted personal finance tracker.</p>
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
      </ul>
      <p style={{ color: "#666", fontSize: 13 }}>
        Health: <a href="/api/health">/api/health</a>
      </p>
    </main>
  );
}
