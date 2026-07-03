import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetRateLimit } from "./rateLimit";

beforeEach(() => resetRateLimit());

describe("rateLimit (fixed window)", () => {
  it("allows up to the limit, then blocks within the window", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, 0)).toBe(true);
    expect(rateLimit("k", 3, 1000, 500)).toBe(false); // 4th within the window
  });

  it("resets after the window elapses", () => {
    expect(rateLimit("k", 1, 1000, 0)).toBe(true);
    expect(rateLimit("k", 1, 1000, 999)).toBe(false); // still in window
    expect(rateLimit("k", 1, 1000, 1000)).toBe(true); // window rolled over
  });

  it("tracks keys independently", () => {
    expect(rateLimit("a", 1, 1000, 0)).toBe(true);
    expect(rateLimit("a", 1, 1000, 0)).toBe(false);
    expect(rateLimit("b", 1, 1000, 0)).toBe(true); // different key, own budget
  });

  it("resetRateLimit(key) clears a single bucket", () => {
    expect(rateLimit("a", 1, 1000, 0)).toBe(true);
    resetRateLimit("a");
    expect(rateLimit("a", 1, 1000, 0)).toBe(true); // allowed again after reset
  });
});
