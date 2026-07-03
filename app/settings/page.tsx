"use client";

import { useEffect, useState, type FormEvent } from "react";

export default function SettingsPage() {
  const [baseCurrency, setBaseCurrency] = useState("");
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { baseCurrency: string }) => {
        setBaseCurrency(d.baseCurrency);
        setDraft(d.baseCurrency);
      })
      .catch(() => setMsg("Error: couldn't load your settings. Refresh to try again."));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ baseCurrency: draft }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setBaseCurrency(d.baseCurrency);
        setDraft(d.baseCurrency);
        setMsg("Base currency saved.");
      } else {
        setMsg(`Error: ${d.error ?? res.statusText}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 480 }}>
      <h1>Settings</h1>

      <div className="card">
        <h2 style={{ fontSize: 18 }}>Base currency</h2>
        <p style={{ fontSize: 13, color: "#555" }}>
          The default currency for new transactions and budgets, and the unit shown on the
          dashboard. Currently <strong>{baseCurrency || "…"}</strong>.
        </p>
        <form onSubmit={save} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label>
            Currency code:{" "}
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value.toUpperCase())}
              maxLength={3}
              size={4}
              placeholder="EGP"
              aria-label="Base currency code"
            />
          </label>
          <button
            type="submit"
            className="btn-primary"
            disabled={busy || draft.length !== 3 || draft === baseCurrency}
          >
            Save
          </button>
        </form>

        <p
          role="status"
          aria-live="polite"
          style={{
            marginTop: 12,
            color: msg.startsWith("Error") ? "var(--danger)" : "var(--success)",
            minHeight: "1.2em",
          }}
        >
          {msg}
        </p>
      </div>
    </main>
  );
}
