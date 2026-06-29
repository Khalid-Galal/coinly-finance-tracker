import { describe, it, expect } from "vitest";
import { dedupeHash } from "./hash";

describe("dedupeHash", () => {
  it("is stable for identical input", () => {
    const a = dedupeHash({ date: "2026-01-01", amountMinor: 100, description: "Costa" }, "acc1");
    const b = dedupeHash({ date: "2026-01-01", amountMinor: 100, description: "Costa" }, "acc1");
    expect(a).toBe(b);
  });

  it("changes when any field changes (amount, description, account)", () => {
    const base = dedupeHash({ date: "2026-01-01", amountMinor: 100, description: "Costa" }, "acc1");
    expect(
      dedupeHash({ date: "2026-01-01", amountMinor: 101, description: "Costa" }, "acc1"),
    ).not.toBe(base);
    expect(
      dedupeHash({ date: "2026-01-01", amountMinor: 100, description: "Cost" }, "acc1"),
    ).not.toBe(base);
    expect(
      dedupeHash({ date: "2026-01-01", amountMinor: 100, description: "Costa" }, "acc2"),
    ).not.toBe(base);
  });

  it("changes when the date changes", () => {
    expect(
      dedupeHash({ date: "2026-01-01", amountMinor: 100, description: "Costa" }, "acc1"),
    ).not.toBe(dedupeHash({ date: "2026-01-02", amountMinor: 100, description: "Costa" }, "acc1"));
  });
});
