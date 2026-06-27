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
        window.location.href = next.startsWith("/") ? next : "/";
      } else {
        setMsg("Incorrect passcode.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 360 }}>
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
        <button type="submit" disabled={busy || !passcode}>
          {busy ? "…" : "Unlock"}
        </button>
      </form>
      <p role="status" aria-live="polite" style={{ color: "#b00", minHeight: "1.2em" }}>
        {msg}
      </p>
    </main>
  );
}
