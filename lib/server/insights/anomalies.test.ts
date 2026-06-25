import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db";
import { detectAnomalies } from "./anomalies";

let accountId = "";
const cats: Record<string, string> = {};

async function spend(category: string, date: string, minor: number) {
  await db.transaction.create({
    data: {
      accountId,
      date: new Date(date),
      amountMinor: -minor,
      currency: "EGP",
      description: category,
      categoryId: cats[category],
      source: "manual",
      dedupeHash: `${category}-${date}`,
    },
  });
}

beforeEach(async () => {
  accountId = (await db.account.create({ data: { name: "M", type: "bank", currency: "EGP" } })).id;
  for (const name of ["Dining", "Groceries", "Transport"]) {
    cats[name] = (await db.category.create({ data: { name } })).id;
  }
  // Dining: steady ~50 EGP/month then a 4x spike in April.
  await spend("Dining", "2026-01-10", 5000);
  await spend("Dining", "2026-02-10", 5000);
  await spend("Dining", "2026-03-10", 5000);
  await spend("Dining", "2026-04-10", 20000);
  // Groceries: steady ~300 EGP/month including April (no spike).
  for (const m of ["01", "02", "03", "04"]) await spend("Groceries", `2026-${m}-12`, 30000);
  // Transport: only appears in April (no history to compare against).
  await spend("Transport", "2026-04-15", 15000);
});

describe("detectAnomalies", () => {
  it("flags a category spiking above its trailing average", async () => {
    const flags = await detectAnomalies("2026-04");
    const names = flags.map((f) => f.category);
    expect(names).toContain("Dining");
    expect(names).not.toContain("Groceries"); // steady, ratio ~1
    expect(names).not.toContain("Transport"); // no history -> not flagged
    const dining = flags.find((f) => f.category === "Dining");
    expect(dining).toMatchObject({ currentMinor: 20000, baselineMinor: 5000 });
    expect(dining?.ratio).toBeCloseTo(4);
  });

  it("returns nothing when there is no current-month spend", async () => {
    expect(await detectAnomalies("2026-09")).toEqual([]);
  });
});
