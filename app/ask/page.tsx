import { AskClient } from "./AskClient";

export default function AskPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Ask Coinly</h1>
      <p>
        <a href="/dashboard">Dashboard</a> · <a href="/transactions">Transactions</a>
      </p>
      <p style={{ color: "#555" }}>
        Ask a question about your finances in plain language. Coinly turns it into a read-only query
        over your data — the generated SQL is shown for every answer.
      </p>
      <AskClient />
    </main>
  );
}
