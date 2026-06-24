import { describe, it, expect } from "vitest";
import { resolveRange } from "./dateRange";

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe("resolveRange", () => {
  const today = new Date("2026-03-15T00:00:00Z");

  it("this-month spans the current calendar month (half-open)", () => {
    const r = resolveRange("this-month", today);
    expect(iso(r.from)).toBe("2026-03-01");
    expect(iso(r.to)).toBe("2026-04-01");
  });

  it("last-month spans the previous month", () => {
    const r = resolveRange("last-month", today);
    expect(iso(r.from)).toBe("2026-02-01");
    expect(iso(r.to)).toBe("2026-03-01");
  });

  it("last-3-months spans three months ending this month", () => {
    const r = resolveRange("last-3-months", today);
    expect(iso(r.from)).toBe("2026-01-01");
    expect(iso(r.to)).toBe("2026-04-01");
  });

  it("ytd spans Jan 1 to end of this month", () => {
    const r = resolveRange("ytd", today);
    expect(iso(r.from)).toBe("2026-01-01");
    expect(iso(r.to)).toBe("2026-04-01");
  });

  it("rolls over the year boundary for last-month in January", () => {
    const r = resolveRange("last-month", new Date("2026-01-10T00:00:00Z"));
    expect(iso(r.from)).toBe("2025-12-01");
    expect(iso(r.to)).toBe("2026-01-01");
  });
});
