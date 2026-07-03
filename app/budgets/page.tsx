"use client";

import { useEffect, useState, type FormEvent } from "react";

type Category = { id: string; name: string };
type Progress = {
  id: string;
  categoryId: string;
  categoryName: string;
  budgetMinor: number;
  spentMinor: number;
  pct: number;
  status: "ok" | "warning" | "over";
};

const COLORS: Record<Progress["status"], string> = {
  ok: "#2a8a4a",
  warning: "#e08a00",
  over: "#d23535",
};
const LABEL: Record<Progress["status"], string> = {
  ok: "On track",
  warning: "Approaching limit",
  over: "Over budget",
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
const egp = (minor: number) => (minor / 100).toFixed(2);

export default function BudgetsPage() {
  const [month, setMonth] = useState<string>(currentMonth);
  const [categories, setCategories] = useState<Category[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [msg, setMsg] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("EGP");

  function loadProgress(m: string) {
    // Returns the promise so mutation handlers can await the refresh instead of racing it.
    return fetch(`/api/budgets?month=${m}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((p: Progress[] | { error: unknown }) => setProgress(Array.isArray(p) ? p : []))
      .catch(() => setMsg("Error: couldn't load budgets for this month."));
  }

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((c: Category[]) => setCategories(c));
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: { baseCurrency: string }) => setBaseCurrency(d.baseCurrency));
  }, []);

  useEffect(() => {
    loadProgress(month);
  }, [month]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const f = new FormData(formEl);
    const amount = Number(f.get("amount"));
    if (!f.get("categoryId") || !Number.isFinite(amount) || amount <= 0) {
      setMsg("Pick a category and a positive amount.");
      return;
    }
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        categoryId: String(f.get("categoryId")),
        month,
        amountMinor: Math.round(amount * 100),
        currency: baseCurrency,
      }),
    });
    if (res.ok) {
      formEl.reset();
      setMsg("Budget saved.");
      await loadProgress(month);
    } else {
      setMsg(`Error: ${JSON.stringify((await res.json()).error)}`);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    if (!res.ok) {
      // Without this, a failed delete silently reloads and the row reappears with no feedback.
      setMsg("Error: couldn't remove that budget.");
      return;
    }
    setMsg("Budget removed.");
    await loadProgress(month);
  }

  return (
    <main style={{ maxWidth: 640 }}>
      <h1>Budgets</h1>
      <p>
        <label>
          Month: <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
      </p>

      <div className="card">
        <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select name="categoryId" defaultValue="" required>
            <option value="" disabled>
              Category…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder={`Amount (${baseCurrency})`}
            required
          />
          <button type="submit" className="btn-primary">
            Set budget
          </button>
        </form>
      </div>
      {msg && (
        <p
          role="status"
          aria-live="polite"
          style={{ color: msg.startsWith("Error") ? "var(--danger)" : "var(--success)" }}
        >
          {msg}
        </p>
      )}

      {progress.length === 0 ? (
        <p>No budgets for {month} yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {progress.map((p) => (
            <li key={p.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{p.categoryName}</strong>
                <span style={{ color: COLORS[p.status] }}>
                  {egp(p.spentMinor)} / {egp(p.budgetMinor)} {baseCurrency} (
                  {Math.round(p.pct * 100)}%)
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={Math.round(p.pct * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${p.categoryName} budget used`}
                style={{
                  background: "#eee",
                  borderRadius: 4,
                  height: 18,
                  overflow: "hidden",
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, p.pct * 100)}%`,
                    height: "100%",
                    background: COLORS[p.status],
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                <small style={{ color: COLORS[p.status] }}>
                  {p.status === "over"
                    ? `${LABEL.over} by ${egp(p.spentMinor - p.budgetMinor)} ${baseCurrency}`
                    : LABEL[p.status]}
                </small>
                <button type="button" onClick={() => remove(p.id)} style={{ fontSize: 12 }}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
