import { describe, it, expect } from "vitest";
import { convertMinor } from "./convert";

describe("convertMinor", () => {
  it("converts minor units with the given rate", () => {
    // 100.00 USD at 50.5 EGP/USD -> 5050.00 EGP -> 505000 minor
    expect(convertMinor(10000, "USD", "EGP", 50.5)).toBe(505000);
  });

  it("returns the amount unchanged when currencies match", () => {
    expect(convertMinor(12345, "EGP", "EGP", 999)).toBe(12345);
  });

  it("rounds to the nearest minor unit", () => {
    expect(convertMinor(101, "USD", "EGP", 1.005)).toBe(102); // 101 * 1.005 = 101.505
  });
});
