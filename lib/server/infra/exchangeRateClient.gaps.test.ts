import { describe, it, expect, vi, afterEach } from "vitest";
import { db } from "../db";
import { getRates, fetchRatesFromApi } from "./exchangeRateClient";
import { convertMinor } from "../money/convert";

// GROUP_C gaps (TEST_PLAN §5 exchangeRateClient): null/empty `rates` payloads and the empty-cache
// fallback that hands `convertMinor` an undefined rate (NaN money corruption).
afterEach(() => vi.unstubAllGlobals());

function mockFetch(
  impl: () => Promise<{ ok: boolean; status?: number; json: () => Promise<unknown> }>,
) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

describe("exchangeRateClient — degenerate payloads", () => {
  it("throws when the API omits `rates` (null)", async () => {
    mockFetch(async () => ({ ok: true, json: async () => ({ rates: null }) }));
    await expect(fetchRatesFromApi("EGP")).rejects.toThrow(/missing rates/i);
  });

  it("accepts an empty `rates` object as a live (but empty) result, persisting nothing", async () => {
    mockFetch(async () => ({ ok: true, json: async () => ({ rates: {} }) }));
    const out = await getRates("EGP", new Date("2026-01-15"));
    expect(out.source).toBe("live");
    expect(out.rates).toEqual({});
    expect(await db.exchangeRate.count()).toBe(0);
  });

  it("API down + empty cache -> {} cache result, and convertMinor then returns NaN", async () => {
    mockFetch(async () => {
      throw new Error("network down");
    });
    const out = await getRates("EGP", new Date("2026-01-15"));
    expect(out.source).toBe("cache");
    expect(out.rates).toEqual({});
    // The downstream hazard: a missing quote rate flows into convertMinor as undefined -> NaN.
    expect(Number.isNaN(convertMinor(10000, "EGP", "USD", out.rates.USD))).toBe(true);
  });
});
