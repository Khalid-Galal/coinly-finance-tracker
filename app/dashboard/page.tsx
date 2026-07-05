import {
  resolveRange,
  lastNMonths,
  RANGE_PRESETS,
  type RangePreset,
} from "@/lib/server/analytics/dateRange";
import { summarize } from "@/lib/server/analytics/summary";
import { monthlyTrend } from "@/lib/server/analytics/trend";
import { getBaseCurrency } from "@/lib/server/settings/settingService";

// Server-rendered dashboard: range-preset income/expense/net stats, category spending bars, and a
// 6-month trend chart, computed by the lib/server/analytics queries over the Prisma database.
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
  const [s, baseCurrency] = await Promise.all([
    summarize(resolveRange(preset, now)),
    getBaseCurrency(),
  ]);
  const maxExpense = s.byCategory[0]?.expenseMinor ?? 0;

  const trend = await monthlyTrend(lastNMonths(6, now));
  const maxTrend = Math.max(1, ...trend.map((p) => Math.max(p.incomeMinor, p.expenseMinor)));
  const barHeight = (minor: number) => Math.round((minor / maxTrend) * 120);

  return (
    <main>
      <h1>Dashboard</h1>
      <p className="muted">Your money at a glance — income, spending, and trends.</p>
      <ul className="pills">
        {RANGE_PRESETS.map((p) => (
          <li key={p}>
            <a href={`/dashboard?range=${p}`} className={`pill${p === preset ? " active" : ""}`}>
              {p}
            </a>
          </li>
        ))}
      </ul>

      <div className="stat-grid">
        <div className="stat stat--income">
          <div className="label">Income</div>
          <div className="value">
            {fmt(s.incomeMinor)} {baseCurrency}
          </div>
        </div>
        <div className="stat stat--expense">
          <div className="label">Expenses</div>
          <div className="value">
            {fmt(s.expenseMinor)} {baseCurrency}
          </div>
        </div>
        <div
          className={`stat${s.netMinor < 0 ? " stat--expense" : s.netMinor > 0 ? " stat--income" : ""}`}
        >
          <div className="label">Net</div>
          <div className="value">
            {fmt(s.netMinor)} {baseCurrency}
          </div>
        </div>
      </div>

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
                        background: "var(--brand)",
                        height: 12,
                        borderRadius: 3,
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
        role="img"
        aria-label={`Income versus expenses, last 6 months. ${trend
          .map(
            (p) =>
              `${p.month.slice(2)}: income ${fmt(p.incomeMinor)}, expenses ${fmt(p.expenseMinor)}`,
          )
          .join("; ")}.`}
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
        {s.count} transactions in range. Amounts shown in {baseCurrency} (your base currency — set
        it in <a href="/settings">Settings</a>). Mixed-currency conversion is planned.
      </p>
    </main>
  );
}
