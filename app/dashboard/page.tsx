import {
  resolveRange,
  lastNMonths,
  RANGE_PRESETS,
  type RangePreset,
} from "@/lib/server/analytics/dateRange";
import { summarize } from "@/lib/server/analytics/summary";
import { monthlyTrend } from "@/lib/server/analytics/trend";

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
  const now = new Date();
  const s = await summarize(resolveRange(preset, now));
  const maxExpense = s.byCategory[0]?.expenseMinor ?? 0;

  const trend = await monthlyTrend(lastNMonths(6, now));
  const maxTrend = Math.max(1, ...trend.map((p) => Math.max(p.incomeMinor, p.expenseMinor)));
  const barHeight = (minor: number) => Math.round((minor / maxTrend) * 120);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Dashboard</h1>
      <p>
        <a href="/transactions">Transactions</a> · <a href="/import">Import</a> ·{" "}
        <a href="/quick-add">Add</a> · <a href="/budgets">Budgets</a> ·{" "}
        <a href="/insights">Insights</a> · <a href="/ask">Ask Coinly</a>
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

      <h2 style={{ marginTop: 24 }}>Spending by category</h2>
      {s.byCategory.length === 0 ? (
        <p>No expenses in this range.</p>
      ) : (
        <div className="table-scroll">
          <table cellPadding={4} style={{ borderCollapse: "collapse" }}>
            <tbody>
              {s.byCategory.map((c) => (
                <tr key={c.categoryId ?? "none"}>
                  <td style={{ paddingRight: 12 }}>{c.name}</td>
                  <td>
                    <div
                      style={{
                        background: "#4a90d9",
                        height: 12,
                        width: `${maxExpense ? Math.max(2, (c.expenseMinor / maxExpense) * 240) : 2}px`,
                      }}
                    />
                  </td>
                  <td style={{ paddingLeft: 12, textAlign: "right" }}>{fmt(c.expenseMinor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ marginTop: 24 }}>Monthly trend (last 6 months)</h2>
      <p style={{ fontSize: 13, color: "#555", margin: "0 0 8px" }}>
        <span style={{ color: "#2a8a4a" }}>■</span> Income{" "}
        <span style={{ color: "#d23535", marginLeft: 12 }}>■</span> Expenses
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 16,
          height: 140,
          borderBottom: "1px solid #ccc",
          paddingBottom: 4,
        }}
      >
        {trend.map((p) => (
          <div
            key={p.month}
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120 }}>
              <div
                title={`Income ${fmt(p.incomeMinor)}`}
                style={{ width: 12, height: barHeight(p.incomeMinor), background: "#2a8a4a" }}
              />
              <div
                title={`Expenses ${fmt(p.expenseMinor)}`}
                style={{ width: 12, height: barHeight(p.expenseMinor), background: "#d23535" }}
              />
            </div>
            <small style={{ marginTop: 4, color: "#555" }}>{p.month.slice(2)}</small>
          </div>
        ))}
      </div>

      <p style={{ color: "#666", fontSize: 13, marginTop: 16 }}>
        {s.count} transactions in range. Amounts in base currency (single-currency MVP).
      </p>
    </main>
  );
}
