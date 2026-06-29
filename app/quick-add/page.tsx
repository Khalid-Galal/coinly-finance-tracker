"use client";

import { useEffect, useState, type FormEvent } from "react";

type Account = { id: string; name: string; currency: string };

export default function QuickAddPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [msg, setMsg] = useState("");

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
    const f = new FormData(formEl);
    const acc = accounts.find((a) => a.id === accountId);
    const body = {
      accountId,
      date: String(f.get("date")),
      amountMinor: Math.round(parseFloat(String(f.get("amount"))) * 100),
      currency: acc?.currency ?? "EGP",
      description: String(f.get("description")),
      source: "manual",
    };
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      formEl.reset();
      setMsg("Added.");
    } else {
      setMsg(`Error: ${JSON.stringify((await res.json()).error)}`);
    }
  }

  return (
    <main>
      <h1>Add transaction</h1>
      {accounts.length === 0 ? (
        <p>
          No accounts yet. <a href="/accounts">Create one first.</a>
        </p>
      ) : (
        <div className="card">
          <form onSubmit={onSubmit}>
            <p>
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
            </p>
            <p>
              <input type="date" name="date" aria-label="Date" required />{" "}
              <input
                type="number"
                name="amount"
                step="0.01"
                placeholder="Amount"
                aria-label="Amount"
                required
              />
            </p>
            <p>
              <input
                name="description"
                placeholder="Description"
                aria-label="Description"
                required
                size={40}
              />
            </p>
            <button type="submit" className="btn-primary">
              Add
            </button>
          </form>
        </div>
      )}
      {msg && <p>{msg}</p>}
    </main>
  );
}
