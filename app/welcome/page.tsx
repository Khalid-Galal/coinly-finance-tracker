"use client";

import { useEffect, useState, type FormEvent } from "react";

const STEPS = ["Base currency", "First account", "Add data"];

export default function WelcomePage() {
  const [step, setStep] = useState(1);
  const [baseCurrency, setBaseCurrency] = useState("EGP");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: { baseCurrency: string }) => setBaseCurrency(d.baseCurrency));
  }, []);

  async function send(url: string, body: object): Promise<boolean> {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: url === "/api/settings" ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMsg("");
        return true;
      }
      const d = await res.json().catch(() => ({}));
      setMsg(`Error: ${d.error ?? res.statusText}`);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveCurrency(e: FormEvent) {
    e.preventDefault();
    if (baseCurrency.length !== 3) {
      setMsg("Enter a 3-letter currency code.");
      return;
    }
    if (await send("/api/settings", { baseCurrency })) setStep(2);
  }

  async function createAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    if (!name) {
      setMsg("Enter an account name.");
      return;
    }
    const ok = await send("/api/accounts", {
      name,
      type: String(f.get("type") ?? "bank"),
      currency: baseCurrency,
    });
    if (ok) setStep(3);
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 520 }}>
      <h1>Welcome to Coinly</h1>
      <ol style={{ display: "flex", gap: 12, listStyle: "none", padding: 0, fontSize: 13 }}>
        {STEPS.map((label, i) => (
          <li
            key={label}
            style={{
              fontWeight: step === i + 1 ? 700 : 400,
              color: step > i + 1 ? "#2a8a4a" : "#555",
            }}
          >
            {step > i + 1 ? "✓ " : `${i + 1}. `}
            {label}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section>
          <p>First, pick the currency you mostly use. You can change it later in Settings.</p>
          <form onSubmit={saveCurrency} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label>
              Base currency:{" "}
              <input
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                size={4}
                aria-label="Base currency code"
              />
            </label>
            <button type="submit" disabled={busy || baseCurrency.length !== 3}>
              Continue
            </button>
          </form>
        </section>
      )}

      {step === 2 && (
        <section>
          <p>Now create your first account — a bank account, cash wallet, or card.</p>
          <form onSubmit={createAccount}>
            <p>
              <input name="name" placeholder="Account name (e.g. CIB Current)" required size={28} />
            </p>
            <p>
              <label>
                Type:{" "}
                <select name="type" defaultValue="bank">
                  <option value="bank">Bank</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                </select>
              </label>{" "}
              <span style={{ color: "#777", fontSize: 13 }}>Currency: {baseCurrency}</span>
            </p>
            <button type="submit" disabled={busy}>
              Create account
            </button>
          </form>
        </section>
      )}

      {step === 3 && (
        <section>
          <p style={{ color: "#2a8a4a", fontWeight: 600 }}>✓ You&apos;re all set!</p>
          <p>Add some transactions to see your dashboard, budgets, and AI insights come to life:</p>
          <ul>
            <li>
              <a href="/import">Import a bank CSV</a> — fastest way to load history
            </li>
            <li>
              <a href="/quick-add">Add a transaction manually</a>
            </li>
            <li>
              <a href="/dashboard">Go to the dashboard</a>
            </li>
          </ul>
        </section>
      )}

      <p
        role="status"
        aria-live="polite"
        style={{ marginTop: 12, color: "#b00", minHeight: "1.2em" }}
      >
        {msg}
      </p>
    </main>
  );
}
