import { describe, it, expect } from "vitest";
import { convertMinor } from "./convert";

// GROUP_C gaps (TEST_PLAN §5 convertMinor): rate=0 silent zero, negative amount, the 2dp
// assumption (0dp currencies like JPY), overflow, and the undefined-rate NaN money-corruption
// path that an empty rate cache feeds (see exchangeRateClient.gaps.test.ts).
describe("convertMinor — edges", () => {
  it("returns 0 for rate 0 (silent zero — documented)", () => {
    expect(convertMinor(10000, "USD", "EGP", 0)).toBe(0);
  });

  it("converts negative amounts (expenses) symmetrically", () => {
    expect(convertMinor(-10000, "USD", "EGP", 50)).toBe(-500000);
  });

  it("short-circuits when from === to, ignoring the rate entirely", () => {
    expect(convertMinor(12345, "EGP", "EGP", 0)).toBe(12345);
    // @ts-expect-error — even an undefined rate is ignored on the same-currency path.
    expect(convertMinor(12345, "EGP", "EGP", undefined)).toBe(12345);
  });

  it("applies the 2dp assumption regardless of the target's real precision (JPY caveat)", () => {
    // ponytail: convertMinor multiplies minor units by the rate with no per-currency dp scaling,
    // so a 0dp currency (JPY) comes out 100x too large. Known limitation, asserted to lock behavior.
    expect(convertMinor(10000, "USD", "JPY", 0.5)).toBe(5000);
  });

  it("stays finite on overflow-scale inputs", () => {
    const out = convertMinor(Number.MAX_SAFE_INTEGER, "A", "B", 1000);
    expect(Number.isFinite(out)).toBe(true);
  });

  it("an undefined rate yields NaN — corrupts money downstream when the rate cache is empty", () => {
    // @ts-expect-error — exercising the unguarded path that empty rate maps reach in production.
    expect(Number.isNaN(convertMinor(10000, "USD", "EGP", undefined))).toBe(true);
  });
});
