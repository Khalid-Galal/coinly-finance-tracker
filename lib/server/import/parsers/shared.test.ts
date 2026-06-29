import { describe, it, expect } from "vitest";
import { toMinor, toIsoDate, pickField, norm, hasColumn } from "./shared";

describe("toMinor", () => {
  it("strips thousands separators and converts to minor units", () => {
    expect(toMinor("1,234.50")).toBe(123450);
  });

  it("handles negative whole amounts", () => {
    expect(toMinor("-2000")).toBe(-200000);
  });

  it("treats blank as zero", () => {
    expect(toMinor("")).toBe(0);
  });

  it("treats non-numeric input as zero", () => {
    expect(toMinor("abc")).toBe(0);
  });

  it("trims surrounding whitespace", () => {
    expect(toMinor("  10 ")).toBe(1000);
  });

  it("rounds half-cents down due to float representation", () => {
    // quirk: 1.005 * 100 = 100.4999.. so Math.round floors to 100, not 101
    expect(toMinor("1.005")).toBe(100);
  });
});

describe("toIsoDate", () => {
  it("passes ISO YYYY-MM-DD through unchanged", () => {
    expect(toIsoDate("2026-01-15")).toBe("2026-01-15");
  });

  it("converts DD/MM/YYYY to ISO", () => {
    expect(toIsoDate("15/01/2026")).toBe("2026-01-15");
  });

  it("zero-pads single-digit day and month", () => {
    expect(toIsoDate("5/3/2026")).toBe("2026-03-05");
  });

  it("misparses US MM/DD/YYYY as DD/MM/YYYY", () => {
    // BUG: assumes DD/MM/YYYY, so a US-style 01/15/2026 yields an invalid month "15"
    expect(toIsoDate("01/15/2026")).toBe("2026-15-01");
  });

  it("leaves unrecognized garbage unchanged", () => {
    expect(toIsoDate("not a date")).toBe("not a date");
  });
});

describe("pickField", () => {
  it("returns the value for a present alias", () => {
    expect(pickField({ a: "x" }, ["a"])).toBe("x");
  });

  it("skips blank values and returns the first non-empty alias", () => {
    expect(pickField({ a: "", b: "y" }, ["a", "b"])).toBe("y");
  });

  it("returns undefined when no alias is present", () => {
    expect(pickField({}, ["a"])).toBeUndefined();
  });
});

describe("norm", () => {
  it("trims and lowercases", () => {
    expect(norm("  Foo Bar ")).toBe("foo bar");
  });
});

describe("hasColumn", () => {
  it("returns true when any alias is present in the columns", () => {
    expect(hasColumn(["date", "amount"], ["amount", "amt"])).toBe(true);
  });

  it("returns false when no alias is present", () => {
    expect(hasColumn(["date"], ["amount"])).toBe(false);
  });
});
