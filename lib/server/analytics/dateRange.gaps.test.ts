import { describe, it, expect } from "vitest";
import { monthRange, shiftMonth, trailingDays, monthKeyOf } from "./dateRange";

// Pure date helpers — no DB. Fills the TEST_PLAN §5 Analytics gap:
// "monthRange/shiftMonth/trailingDays/monthKeyOf untested".
const iso = (d: Date) => d.toISOString();

describe("monthRange", () => {
  it("returns half-open [first, next-first) UTC bounds for a month", () => {
    const r = monthRange("2026-03");
    expect(iso(r.from)).toBe("2026-03-01T00:00:00.000Z");
    expect(iso(r.to)).toBe("2026-04-01T00:00:00.000Z");
  });

  it("rolls the year over for December", () => {
    const r = monthRange("2026-12");
    expect(iso(r.from)).toBe("2026-12-01T00:00:00.000Z");
    expect(iso(r.to)).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("shiftMonth", () => {
  it("shifts within a year (forward, backward, and zero)", () => {
    expect(shiftMonth("2026-03", 2)).toBe("2026-05");
    expect(shiftMonth("2026-03", -2)).toBe("2026-01");
    expect(shiftMonth("2026-03", 0)).toBe("2026-03");
  });

  it("rolls across year boundaries in both directions", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-11", 3)).toBe("2027-02");
  });
});

describe("monthKeyOf", () => {
  it("formats YYYY-MM in UTC with zero-padding", () => {
    expect(monthKeyOf(new Date("2026-09-15T12:00:00Z"))).toBe("2026-09");
    expect(monthKeyOf(new Date("2026-12-31T23:59:59Z"))).toBe("2026-12");
  });

  it("reads UTC, not local time, at the month boundary", () => {
    // 2026-03-01T00:00Z is still February in negative-offset zones; monthKeyOf must use UTC fields.
    expect(monthKeyOf(new Date("2026-03-01T00:00:00Z"))).toBe("2026-03");
  });
});

describe("trailingDays", () => {
  it("returns a half-open window of n calendar days ending today (UTC)", () => {
    const r = trailingDays(7, new Date("2026-06-15T08:30:00Z"));
    expect(iso(r.from)).toBe("2026-06-09T00:00:00.000Z"); // today - 6 days, at midnight
    expect(iso(r.to)).toBe("2026-06-16T00:00:00.000Z"); // tomorrow midnight (exclusive)
  });

  it("n=1 spans only today", () => {
    const r = trailingDays(1, new Date("2026-06-15T23:00:00Z"));
    expect(iso(r.from)).toBe("2026-06-15T00:00:00.000Z");
    expect(iso(r.to)).toBe("2026-06-16T00:00:00.000Z");
  });
});
