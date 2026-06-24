import { describe, it, expect, vi, afterEach } from "vitest";
import { db } from "../db";
import { getRates, fetchRatesFromApi } from "./exchangeRateClient";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFetch(
  impl: () => Promise<{ ok: boolean; status?: number; json: () => Promise<unknown> }>,
) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

describe("exchangeRateClient", () => {
  it("fetches and persists live rates", async () => {
    mockFetch(async () => ({ ok: true, json: async () => ({ rates: { USD: 0.02, EUR: 0.018 } }) }));
    const out = await getRates("EGP", new Date("2026-01-15"));
    expect(out.source).toBe("live");
    expect(out.rates.USD).toBe(0.02);
    expect(await db.exchangeRate.count({ where: { base: "EGP" } })).toBe(2);
  });

  it("falls back to the most recent cached rates when the API fails", async () => {
    await db.exchangeRate.create({
      data: { date: new Date("2026-01-10"), base: "EGP", quote: "USD", rate: 0.021 },
    });
    mockFetch(async () => {
      throw new Error("network down");
    });
    const out = await getRates("EGP", new Date("2026-01-15"));
    expect(out.source).toBe("cache");
    expect(out.rates.USD).toBe(0.021);
  });

  it("throws on a non-ok API response", async () => {
    mockFetch(async () => ({ ok: false, status: 503, json: async () => ({}) }));
    await expect(fetchRatesFromApi("EGP")).rejects.toThrow();
  });
});
