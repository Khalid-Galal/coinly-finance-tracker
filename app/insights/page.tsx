"use client";

import { useEffect, useState } from "react";

type Insight = {
  id: string;
  type: string;
  content: string;
  model: string | null;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
};
type Anomaly = { category: string; currentMinor: number; baselineMinor: number; ratio: number };
type Usage = { used: number; cap: number; remaining: number };
type Data = { insights: Insight[]; usage: Usage; anomalies: Anomaly[] };

const egp = (minor: number) => (minor / 100).toFixed(2);

export default function InsightsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  function load() {
    fetch("/api/insights")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: Data) => {
        setData(d);
        setErr("");
      })
      .catch(() => setErr("Couldn't load insights. Check your connection and refresh."));
  }
  useEffect(load, []);

  async function generate(type: "weekly" | "monthly") {
    setBusy(type);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setErr("");
      load();
    } catch {
      setErr(`Couldn't generate the ${type} summary. Try again in a moment.`);
    } finally {
      setBusy("");
    }
  }

  const capped = data ? data.usage.remaining === 0 : false;

  return (
    <main style={{ maxWidth: 680 }}>
      <h1>Insights</h1>

      <p>
        <button onClick={() => generate("weekly")} disabled={!!busy}>
          {busy === "weekly" ? "Generating…" : "Generate weekly summary"}
        </button>{" "}
        <button onClick={() => generate("monthly")} disabled={!!busy}>
          {busy === "monthly" ? "Generating…" : "Generate monthly summary"}
        </button>
      </p>

      {err && (
        <p role="alert" style={{ color: "var(--danger)" }}>
          {err}
        </p>
      )}

      {data && (
        <p style={{ fontSize: 13, color: capped ? "var(--danger)" : "var(--muted)" }}>
          AI usage today: {data.usage.used} / {data.usage.cap}
          {capped && " — daily cap reached; summaries fall back to a non-AI report."}
        </p>
      )}

      {data && data.anomalies.length > 0 && (
        <section
          style={{
            background: "#fff4f4",
            border: "1px solid #f0caca",
            padding: 12,
            borderRadius: 6,
          }}
        >
          <strong>⚠ Spending alerts (this month)</strong>
          <ul style={{ margin: "8px 0 0" }}>
            {data.anomalies.map((a) => (
              <li key={a.category}>
                {a.category}: {egp(a.currentMinor)} EGP — {a.ratio.toFixed(1)}× your usual{" "}
                {egp(a.baselineMinor)}.
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 style={{ marginTop: 24 }}>Recent summaries</h2>
      {!data || data.insights.length === 0 ? (
        <p>No insights yet. Generate one above.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {data.insights.map((i) => (
            <li
              key={i.id}
              style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12, marginBottom: 12 }}
            >
              <div style={{ fontSize: 12, color: "#777" }}>
                {i.type} · {i.periodStart.slice(0, 10)} → {i.periodEnd.slice(0, 10)} ·{" "}
                {i.model ? `AI (${i.model})` : "offline report"}
              </div>
              <p style={{ margin: "6px 0 0" }}>{i.content}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
