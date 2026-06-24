"use client";

import { useState } from "react";

type QaResult = {
  question: string;
  sql: string | null;
  rows: Record<string, unknown>[];
  answer: string;
  error?: string;
};

const EXAMPLES = [
  "How much did I spend on Dining this month?",
  "What were my 5 biggest expenses in 2026-03?",
  "How much did I earn vs spend in 2026-03?",
];

function cell(key: string, v: unknown): string {
  if (typeof v === "number" && /minor$/i.test(key)) return (v / 100).toFixed(2);
  return v === null || v === undefined ? "—" : String(v);
}

export function AskClient() {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<QaResult | null>(null);

  async function ask(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ question: text, sql: null, rows: [], answer: "", error: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const columns = result && result.rows.length > 0 ? Object.keys(result.rows[0]) : [];

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        style={{ display: "flex", gap: 8, marginTop: 12 }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. How much did I spend on Dining last month?"
          style={{ flex: 1, padding: 8 }}
          aria-label="Question"
        />
        <button type="submit" disabled={busy}>
          {busy ? "Asking…" : "Ask"}
        </button>
      </form>

      <p style={{ fontSize: 13, color: "#777" }}>
        Try:{" "}
        {EXAMPLES.map((ex, i) => (
          <span key={ex}>
            {i > 0 && " · "}
            <button
              type="button"
              onClick={() => {
                setQuestion(ex);
                ask(ex);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#06c",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {ex}
            </button>
          </span>
        ))}
      </p>

      {result && (
        <div style={{ marginTop: 16 }}>
          {result.error ? (
            <p style={{ color: "#b00" }}>⚠ {result.error}</p>
          ) : (
            <>
              <p style={{ fontWeight: 600 }}>{result.answer}</p>
              {result.rows.length > 0 && (
                <table
                  border={1}
                  cellPadding={6}
                  style={{ borderCollapse: "collapse", marginTop: 8 }}
                >
                  <thead>
                    <tr>
                      {columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, ri) => (
                      <tr key={ri}>
                        {columns.map((c) => (
                          <td key={c} style={{ textAlign: /minor$/i.test(c) ? "right" : "left" }}>
                            {cell(c, row[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
          {result.sql && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: "pointer", color: "#555" }}>Show generated SQL</summary>
              <pre style={{ background: "#f4f4f4", padding: 12, overflowX: "auto" }}>
                {result.sql}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
