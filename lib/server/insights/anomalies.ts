import { summarize } from "../analytics/summary";
import { monthRange, shiftMonth } from "../analytics/dateRange";

export type AnomalyFlag = {
  categoryId: string | null;
  category: string;
  currentMinor: number;
  baselineMinor: number; // average monthly spend over the baseline window
  ratio: number; // current / baseline
};

export type AnomalyOptions = {
  baselineMonths?: number; // how many prior months form the baseline (default 3)
  threshold?: number; // flag when current >= baseline * threshold (default 1.5)
  floorMinor?: number; // ignore small categories below this (default 100.00)
};

/**
 * Rule-based anomaly detection (US-D3): flag categories whose spend this month is unusually
 * high versus their own trailing average. Deterministic — no LLM. A category with no spending
 * history is not flagged (nothing to be unusual against).
 */
export async function detectAnomalies(
  month: string,
  opts: AnomalyOptions = {},
): Promise<AnomalyFlag[]> {
  const baselineMonths = opts.baselineMonths ?? 3;
  const threshold = opts.threshold ?? 1.5;
  const floorMinor = opts.floorMinor ?? 10_000;

  const current = await summarize(monthRange(month));

  const baselineSum = new Map<string, number>();
  for (let i = 1; i <= baselineMonths; i++) {
    const prior = await summarize(monthRange(shiftMonth(month, -i)));
    for (const c of prior.byCategory) {
      const key = c.categoryId ?? "__none__";
      baselineSum.set(key, (baselineSum.get(key) ?? 0) + c.expenseMinor);
    }
  }

  const flags: AnomalyFlag[] = [];
  for (const c of current.byCategory) {
    const key = c.categoryId ?? "__none__";
    const baselineMinor = (baselineSum.get(key) ?? 0) / baselineMonths;
    if (
      c.expenseMinor >= floorMinor &&
      baselineMinor > 0 &&
      c.expenseMinor >= baselineMinor * threshold
    ) {
      flags.push({
        categoryId: c.categoryId,
        category: c.name,
        currentMinor: c.expenseMinor,
        baselineMinor: Math.round(baselineMinor),
        ratio: c.expenseMinor / baselineMinor,
      });
    }
  }
  return flags.sort((a, b) => b.ratio - a.ratio);
}
