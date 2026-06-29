"use client";

import { useState, type FormEvent } from "react";

export default function UnlockPage() {
  const [passcode, setPasscode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        const next = new URLSearchParams(window.location.search).get("next") || "/";
        // Only same-origin paths. Reject protocol-relative ("//host") and "/\\host" — both
        // start with "/" yet navigate off-site (open redirect). Must be a single leading slash.
        const safe = /^\/(?![/\\])/.test(next) ? next : "/";
        window.location.href = safe;
      } else {
        setMsg("Incorrect passcode.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 360 }}>
      <div className="card">
        <h1>Coinly</h1>
        <p>This demo is passcode-protected. Enter the passcode to continue.</p>
        <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            aria-label="Passcode"
            placeholder="Passcode"
            autoFocus
          />
          <button type="submit" className="btn-primary" disabled={busy || !passcode}>
            {busy ? "…" : "Unlock"}
          </button>
        </form>
        <p role="status" aria-live="polite" style={{ color: "#b00", minHeight: "1.2em" }}>
          {msg}
        </p>
      </div>
    </main>
  );
}
