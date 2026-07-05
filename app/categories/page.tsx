"use client";

import { useEffect, useState, type FormEvent } from "react";

type Category = { id: string; name: string };

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const [mergeFrom, setMergeFrom] = useState("");
  const [mergeInto, setMergeInto] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    // Returns the promise so callers can await the refresh — a fire-and-forget load() lets two
    // rapid mutations (e.g. adding TempA then TempB) run overlapping fetches whose responses can
    // land out of order and clobber the newer list with a stale one.
    return fetch("/api/categories")
      .then((r) => r.json())
      .then((c: Category[]) => {
        setCats(c);
        // Preserve any in-progress edits; only seed names for newly-seen categories.
        setDrafts((prev) => Object.fromEntries(c.map((x) => [x.id, prev[x.id] ?? x.name])));
      });
  }
  useEffect(() => {
    load();
  }, []);

  async function report(res: Response, ok: string) {
    if (res.ok) {
      setMsg(ok);
      await load();
      return;
    }
    let detail = res.statusText;
    try {
      detail = (await res.json()).error ?? detail;
    } catch {
      /* non-JSON body */
    }
    setMsg(`Error: ${detail}`);
  }

  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await run(async () => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) setNewName("");
      await report(res, "Category created.");
    });
  }

  async function rename(id: string) {
    const name = (drafts[id] ?? "").trim();
    const current = cats.find((c) => c.id === id)?.name.trim();
    if (!name) {
      setMsg("Error: name cannot be empty");
      return;
    }
    if (name === current) return;
    await run(async () => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await report(res, "Renamed.");
    });
  }

  function archive(id: string, name: string) {
    if (!window.confirm(`Archive "${name}"? It will be hidden from lists.`)) return;
    run(async () =>
      report(await fetch(`/api/categories/${id}`, { method: "DELETE" }), "Archived."),
    );
  }

  async function merge(e: FormEvent) {
    e.preventDefault();
    if (!mergeFrom || !mergeInto || mergeFrom === mergeInto) return;
    await run(async () => {
      const res = await fetch(`/api/categories/${mergeFrom}/merge`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intoId: mergeInto }),
      });
      if (res.ok) {
        setMergeFrom("");
        setMergeInto("");
      }
      await report(res, "Merged.");
    });
  }

  return (
    <main style={{ maxWidth: 560 }}>
      <h1>Manage categories</h1>

      <form onSubmit={create} className="card" style={{ marginBottom: 16 }}>
        <label>
          New category:{" "}
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Subscriptions"
            maxLength={100}
          />
        </label>{" "}
        <button type="submit" className="btn-primary" disabled={busy || !newName.trim()}>
          Add
        </button>
      </form>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {cats.map((c) => {
          const draft = (drafts[c.id] ?? "").trim();
          return (
            <li
              key={c.id}
              style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}
            >
              <input
                aria-label={`Rename ${c.name}`}
                value={drafts[c.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                maxLength={100}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button
                type="button"
                onClick={() => rename(c.id)}
                disabled={busy || !draft || draft === c.name.trim()}
              >
                Save
              </button>
              <button type="button" onClick={() => archive(c.id, c.name)} disabled={busy}>
                Archive
              </button>
            </li>
          );
        })}
      </ul>

      <h2 style={{ marginTop: 24, fontSize: 18 }}>Merge categories</h2>
      <p style={{ fontSize: 13, color: "#555" }}>
        Moves all transactions, rules, and budgets from one category into another, then archives the
        first.
      </p>
      <form
        onSubmit={merge}
        style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}
      >
        <select
          aria-label="Merge from"
          value={mergeFrom}
          onChange={(e) => setMergeFrom(e.target.value)}
        >
          <option value="">Merge…</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <span>into</span>
        <select
          aria-label="Merge into"
          value={mergeInto}
          onChange={(e) => setMergeInto(e.target.value)}
        >
          <option value="">Keep…</option>
          {cats
            .filter((c) => c.id !== mergeFrom)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
        <button
          type="submit"
          disabled={busy || !mergeFrom || !mergeInto || mergeFrom === mergeInto}
        >
          Merge
        </button>
      </form>

      <p
        role="status"
        aria-live="polite"
        style={{ marginTop: 12, color: "#555", minHeight: "1.2em" }}
      >
        {msg}
      </p>
    </main>
  );
}
