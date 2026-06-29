"use client";

import { useEffect, useState, type FormEvent } from "react";

type Account = { id: string; name: string; type: string; currency: string };

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [msg, setMsg] = useState("");

  function load() {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((a: Account[]) => setAccounts(a));
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
      load();
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
        <form onSubmit={onSubmit}>
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
