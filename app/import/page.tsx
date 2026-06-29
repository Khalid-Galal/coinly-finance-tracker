"use client";

import { useEffect, useState, type FormEvent } from "react";

type Account = { id: string; name: string };

export default function ImportPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((a: Account[]) => {
        setAccounts(a);
        if (a[0]) setAccountId(a[0].id);
      });
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    form.set("accountId", accountId);
    setResult("Importing…");
    const res = await fetch("/api/import", { method: "POST", body: form });
    const data = await res.json();
    setResult(
      res.ok ? `Imported ${data.imported}, skipped ${data.skipped}.` : `Error: ${data.error}`,
    );
  }

  return (
    <main>
      <h1>Import CSV</h1>
      {accounts.length === 0 ? (
        <p>
          No accounts yet. <a href="/accounts">Create one first.</a>
        </p>
      ) : (
        <div className="card">
          <form onSubmit={onSubmit}>
            <label>
              Account:{" "}
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <p>
              <input
                type="file"
                name="file"
                accept=".csv,text/csv"
                aria-label="CSV file to import"
                required
              />
            </p>
            <button type="submit" className="btn-primary">
              Import
            </button>
            <p style={{ fontSize: 13, color: "#666", marginTop: 12 }}>
              Supported: a single signed <code>Amount</code> column, or separate <code>Debit</code>/
              <code>Credit</code> columns (CIB, Banque Misr, NBE). Dates as YYYY-MM-DD or
              DD/MM/YYYY. Duplicate rows are skipped automatically.
            </p>
          </form>
        </div>
      )}
      {result && <p>{result}</p>}
    </main>
  );
}
