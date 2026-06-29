import { describe, it, expect } from "vitest";
import { db } from "../db";
import { monthlyTrend } from "./trend";

// TEST_PLAN §5 Analytics monthlyTrend gaps: half-open boundary (=from incl / =to excl),
// single-month range, degenerate from===to.
async function acct() {
  return (await db.account.create({ data: { name: "A", type: "bank", currency: "EGP" } })).id;
}

async function tx(accountId: string, date: string, amountMinor: number, hash: string) {
  await db.transaction.create({
    data: {
      accountId,
      date: new Date(date),
      amountMinor,
      currency: "EGP",
      description: "x",
      source: "manual",
      dedupeHash: hash,
    },
  });
}

describe("monthlyTrend — range boundaries", () => {
  it("includes a transaction exactly at `from` and excludes one exactly at `to` (half-open)", async () => {
    const a = await acct();
    await tx(a, "2026-02-01T00:00:00Z", -5000, "at-from"); // == from -> included (gte)
    await tx(a, "2026-03-01T00:00:00Z", -9000, "at-to"); // == to   -> excluded (lt)
    const trend = await monthlyTrend({
      from: new Date("2026-02-01T00:00:00Z"),
      to: new Date("2026-03-01T00:00:00Z"),
    });
    expect(trend.map((p) => p.month)).toEqual(["2026-02"]);
    expect(trend[0]).toMatchObject({ expenseMinor: 5000, incomeMinor: 0 }); // only the at-from txn
  });

  it("a single-month range yields exactly one bucket", async () => {
    const a = await acct();
    await tx(a, "2026-05-10T00:00:00Z", 12000, "m1");
    const trend = await monthlyTrend({
      from: new Date("2026-05-01T00:00:00Z"),
      to: new Date("2026-06-01T00:00:00Z"),
    });
    expect(trend).toHaveLength(1);
    expect(trend[0]).toMatchObject({
      month: "2026-05",
      incomeMinor: 12000,
      expenseMinor: 0,
      netMinor: 12000,
    });
  });

  it("a degenerate from===to range yields no buckets", async () => {
    const a = await acct();
    await tx(a, "2026-05-10T00:00:00Z", 12000, "m1");
    const trend = await monthlyTrend({
      from: new Date("2026-05-01T00:00:00Z"),
      to: new Date("2026-05-01T00:00:00Z"),
    });
    expect(trend).toEqual([]);
  });
});
