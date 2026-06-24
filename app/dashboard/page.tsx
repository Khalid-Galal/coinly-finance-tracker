import { resolveRange, RANGE_PRESETS, type RangePreset } from "@/lib/server/analytics/dateRange";
import { summarize } from "@/lib/server/analytics/summary";

export const dynamic = "force-dynamic";

const fmt = (minor: number) => (minor / 100).toFixed(2);

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: raw } = await searchParams;
  const preset: RangePreset = (RANGE_PRESETS as readonly string[]).includes(raw ?? "")
    ? (raw as RangePreset)
    : "this-month";
  const s = await summarize(resolveRange(preset, new Date()));

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Dashboard</h1>
      <p>
        <a href="/transactions">Transactions</a> · <a href="/import">Import</a> ·{" "}
        <a href="/quick-add">Add</a>
      </p>
      <p>
        {RANGE_PRESETS.map((p) => (
          <a
            key={p}
            href={`/dashboard?range=${p}`}
            style={{ marginRight: 12, fontWeight: p === preset ? 700 : 400 }}
          >
            {p}
          </a>
        ))}
      </p>
      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <th style={{ textAlign: "left" }}>Income</th>
            <td style={{ textAlign: "right" }}>{fmt(s.incomeMinor)}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>Expenses</th>
            <td style={{ textAlign: "right" }}>{fmt(s.expenseMinor)}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>Net</th>
            <td style={{ textAlign: "right" }}>{fmt(s.netMinor)}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ color: "#666", fontSize: 13 }}>
        {s.count} transactions in range. Amounts in base currency (single-currency MVP).
      </p>
    </main>
  );
}
