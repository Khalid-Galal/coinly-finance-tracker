import { db } from "../db";
import { geminiGenerateText } from "../infra/geminiClient";
import { summarize, type Summary } from "../analytics/summary";
import { monthRange, monthKeyOf, trailingDays } from "../analytics/dateRange";
import { detectAnomalies, type AnomalyFlag } from "./anomalies";
import { getLlmUsage, recordLlmCall } from "./costGuard";

export type InsightType = "weekly" | "monthly";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const fmt = (minor: number) => (minor / 100).toFixed(2);

/** Only AGGREGATES go to the LLM — never raw transactions, payees, or account numbers. */
function buildPrompt(type: InsightType, s: Summary, anomalies: AnomalyFlag[]): string {
  const cats = s.byCategory
    .slice(0, 6)
    .map((c) => `${c.name}: ${fmt(c.expenseMinor)}`)
    .join(", ");
  const anom = anomalies.length
    ? `Categories above their usual average: ${anomalies.map((a) => `${a.category} (${a.ratio.toFixed(1)}x)`).join(", ")}.`
    : "No unusual spikes versus prior months.";
  return `You are a friendly personal-finance assistant. Using ONLY the aggregate figures below (Egyptian pounds), write a concise ${type} insight of 2-3 plain-language sentences. Do not invent numbers or transactions.
Income: ${fmt(s.incomeMinor)}. Expenses: ${fmt(s.expenseMinor)}. Net: ${fmt(s.netMinor)}.
Spending by category: ${cats || "none"}.
${anom}
End with one short, practical suggestion.`;
}

/** Deterministic summary used when the daily AI cap is reached, so the feature still works. */
function fallback(type: InsightType, s: Summary, anomalies: AnomalyFlag[]): string {
  const parts = [
    `Your ${type} summary: income ${fmt(s.incomeMinor)}, expenses ${fmt(s.expenseMinor)}, net ${fmt(s.netMinor)} EGP across ${s.count} transactions.`,
  ];
  if (s.byCategory.length) {
    parts.push(`Top category: ${s.byCategory[0].name} (${fmt(s.byCategory[0].expenseMinor)} EGP).`);
  }
  if (anomalies.length) {
    parts.push(`Watch: ${anomalies.map((a) => a.category).join(", ")} above your usual average.`);
  }
  return parts.join(" ");
}

/**
 * Generate and persist a weekly or monthly AI insight (US-D1/D2). Respects the daily cost cap
 * (US-D4): when the cap is reached it returns a deterministic fallback instead of calling the LLM.
 * `generate` is injectable so tests run without the network.
 */
export async function generateInsight(
  type: InsightType,
  now: Date = new Date(),
  generate: (prompt: string) => Promise<string> = geminiGenerateText,
) {
  const range = type === "weekly" ? trailingDays(7, now) : monthRange(monthKeyOf(now));
  const summary = await summarize(range);
  const anomalies = type === "monthly" ? await detectAnomalies(monthKeyOf(now)) : [];

  const usage = await getLlmUsage(now);
  let content: string;
  let model: string | null = null;
  if (usage.remaining > 0) {
    content = (await generate(buildPrompt(type, summary, anomalies))).trim();
    await recordLlmCall(now);
    model = MODEL;
  } else {
    content = fallback(type, summary, anomalies);
  }

  return db.insight.create({
    data: { periodStart: range.from, periodEnd: range.to, type, content, model },
  });
}

export function getRecentInsights(limit = 10) {
  return db.insight.findMany({ orderBy: { generatedAt: "desc" }, take: limit });
}
