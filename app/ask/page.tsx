import { AskClient } from "./AskClient";

export default function AskPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Ask Coinly</h1>
      <p>
        <a href="/dashboard">Dashboard</a> · <a href="/transactions">Transactions</a>
      </p>
      <p style={{ color: "#555" }}>
        Ask a question about your finances in plain language — type it, or tap 🎤 to speak it.
        Coinly turns it into a read-only query over your data, reads the answer back, and shows the
        generated SQL for every answer.
      </p>
      <AskClient />
    </main>
  );
}
