import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db";
import { detectAnomalies } from "./anomalies";

// TEST_PLAN §5 Insights detectAnomalies gaps: custom opts (threshold/baselineMonths/floorMinor),
// __none__/Uncategorized flag, multi-flag sort, exact floorMinor boundary (>= included).
let accountId = "";
let hashSeq = 0;

beforeEach(async () => {
  accountId = (await db.account.create({ data: { name: "A", type: "bank", currency: "EGP" } })).id;
});

async function cat(name: string) {
  return (await db.category.create({ data: { name } })).id;
}

async function spend(categoryId: string | null, date: string, minor: number) {
  await db.transaction.create({
    data: {
      accountId,
      date: new Date(date),
      amountMinor: -minor,
      currency: "EGP",
      description: "x",
      categoryId: categoryId ?? undefined,
      source: "manual",
      dedupeHash: `a-${hashSeq++}`,
    },
  });
}

// Steady `base` for Jan/Feb/Mar 2026, then `current` in April.
async function history(categoryId: string | null, base: number, current: number) {
  for (const m of ["01", "02", "03"]) await spend(categoryId, `2026-${m}-10T00:00:00Z`, base);
  if (current > 0) await spend(categoryId, "2026-04-10T00:00:00Z", current);
}

describe("detectAnomalies — custom options", () => {
  it("respects a custom threshold", async () => {
    const dining = await cat("Dining");
    await history(dining, 5000, 20000); // ratio 4
    expect((await detectAnomalies("2026-04")).map((f) => f.category)).toContain("Dining");
    expect(await detectAnomalies("2026-04", { threshold: 5 })).toEqual([]); // 4 < 5 -> none
  });

  it("respects a custom baselineMonths window", async () => {
    const c = await cat("C");
    await spend(c, "2026-01-10T00:00:00Z", 2000);
    await spend(c, "2026-02-10T00:00:00Z", 2000);
    await spend(c, "2026-03-10T00:00:00Z", 10000);
    await spend(c, "2026-04-10T00:00:00Z", 12000);
    // 1-month baseline = March (10000): 12000/10000 = 1.2 < 1.5 -> not flagged.
    expect(await detectAnomalies("2026-04", { baselineMonths: 1 })).toEqual([]);
    // 3-month baseline = (2000+2000+10000)/3 ~= 4667: 12000/4667 ~= 2.57 -> flagged.
    expect((await detectAnomalies("2026-04")).map((f) => f.category)).toContain("C");
  });

  it("respects a custom floorMinor", async () => {
    const c = await cat("C");
    await history(c, 4000, 10000); // ratio 2.5
    expect((await detectAnomalies("2026-04")).map((f) => f.category)).toContain("C");
    expect(await detectAnomalies("2026-04", { floorMinor: 10001 })).toEqual([]); // 10000 < 10001
  });
});

describe("detectAnomalies — floorMinor boundary", () => {
  it("includes current spend exactly at the default floor and excludes spend just below it", async () => {
    const atFloor = await cat("AtFloor");
    const below = await cat("Below");
    await history(atFloor, 4000, 10000); // current == 10000 (default floor) -> included
    await history(below, 4000, 9999); // current 9999 < floor -> excluded despite a high ratio
    const names = (await detectAnomalies("2026-04")).map((f) => f.category);
    expect(names).toContain("AtFloor");
    expect(names).not.toContain("Below");
  });
});

describe("detectAnomalies — uncategorized and sorting", () => {
  it("flags an uncategorized (null category) spike as 'Uncategorized'", async () => {
    await history(null, 5000, 20000); // ratio 4
    const flag = (await detectAnomalies("2026-04")).find((f) => f.categoryId === null);
    expect(flag).toMatchObject({
      category: "Uncategorized",
      categoryId: null,
      currentMinor: 20000,
    });
  });

  it("sorts multiple flags by ratio descending", async () => {
    const big = await cat("Big");
    const small = await cat("Small");
    await history(big, 5000, 25000); // ratio 5
    await history(small, 5000, 10000); // ratio 2
    const flags = await detectAnomalies("2026-04");
    expect(flags.map((f) => f.category)).toEqual(["Big", "Small"]);
    const ratios = flags.map((f) => f.ratio);
    expect(ratios).toEqual([...ratios].sort((x, y) => y - x));
  });
});
