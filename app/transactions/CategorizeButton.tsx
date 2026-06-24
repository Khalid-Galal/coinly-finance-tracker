"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CategorizeButton() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function run() {
    setBusy(true);
    setMsg("Categorizing…");
    const res = await fetch("/api/categorize", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? `Categorized ${data.categorized} of ${data.total}.` : `Error: ${data.error}`);
    if (res.ok) router.refresh();
  }

  return (
    <span>
      <button onClick={run} disabled={busy}>
        Auto-categorize
      </button>{" "}
      {msg}
    </span>
  );
}
