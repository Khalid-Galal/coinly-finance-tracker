import { AskClient } from "./AskClient";

export default function AskPage() {
  return (
    <main>
      <h1>Ask Coinly</h1>
      <p style={{ color: "#555" }}>
        Ask a question about your finances in plain language — type it, or tap 🎤 to speak it.
        Coinly turns it into a read-only query over your data, reads the answer back, and shows the
        generated SQL for every answer.
      </p>
      <AskClient />
    </main>
  );
}
