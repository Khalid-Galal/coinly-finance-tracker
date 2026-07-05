"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Client table for the transactions page: renders server-provided rows with an inline category
// picker (PATCH /api/transactions/:id) and a bulk auto-categorize action (POST /api/categorize).
type Txn = {
  id: string;
  date: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  amountMinor: number;
  currency: string;
  source: string;
};
type Category = { id: string; name: string };

export function TransactionsTable({
  transactions,
  categories,
}: {
  transactions: Txn[];
  categories: Category[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  async function categorizeAll() {
    setMsg("Categorizing…");
    const res = await fetch("/api/categorize", { method: "POST" });
    const d = await res.json();
    setMsg(res.ok ? `Categorized ${d.categorized} of ${d.total}.` : `Error: ${d.error}`);
    if (res.ok) router.refresh();
  }

  async function setCategory(id: string, categoryId: string) {
    if (!categoryId) return;
    setBusy(id);
    await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
    setBusy("");
    router.refresh();
  }

  return (
    <div>
      <p>
        <button onClick={categorizeAll}>Auto-categorize</button> {msg}
      </p>
      <div className="table-scroll">
        <table border={1} cellPadding={6} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>{t.description}</td>
                <td>
                  <select
                    aria-label={`Category for ${t.description}`}
                    value={t.categoryId ?? ""}
                    disabled={busy === t.id}
                    onChange={(e) => setCategory(t.id, e.target.value)}
                  >
                    <option value="">{t.categoryName ?? "—"}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ textAlign: "right" }}>
                  {(t.amountMinor / 100).toFixed(2)} {t.currency}
                </td>
                <td>{t.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
