"use client";

import { useEffect, useState, type FormEvent } from "react";

type Account = { id: string; name: string; type: string; currency: string };

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [msg, setMsg] = useState("");

  function load() {
    // Returns the promise so the create handler can await the refresh before it settles.
    return (
      fetch("/api/accounts")
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        // A 401 returns an {error} object, not an array — guard so .map can't crash the page.
        .then((a: Account[]) => setAccounts(Array.isArray(a) ? a : []))
        .catch(() => setMsg("Couldn't load accounts. Refresh or sign in again."))
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const f = new FormData(formEl);
    const body = {
      name: String(f.get("name")),
      type: String(f.get("type") || "bank"),
      currency: String(f.get("currency") || "EGP").toUpperCase(),
    };
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      formEl.reset();
      setMsg("Account created.");
      await load();
    } else {
      setMsg(`Error: ${JSON.stringify((await res.json()).error)}`);
    }
  }

  return (
    <main>
      <h1>Accounts</h1>
      <ul>
        {accounts.map((a) => (
          <li key={a.id}>
            {a.name} ({a.type}, {a.currency})
          </li>
        ))}
      </ul>
      <div className="card">
        <form onSubmit={onSubmit} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input name="name" placeholder="Account name" aria-label="Account name" required />{" "}
          <input name="type" placeholder="type" defaultValue="bank" aria-label="Account type" />{" "}
          <input
            name="currency"
            placeholder="EGP"
            defaultValue="EGP"
            maxLength={3}
            size={4}
            aria-label="Currency code"
          />{" "}
          <button type="submit" className="btn-primary">
            Add account
          </button>
        </form>
      </div>
      {msg && <p>{msg}</p>}
    </main>
  );
}
