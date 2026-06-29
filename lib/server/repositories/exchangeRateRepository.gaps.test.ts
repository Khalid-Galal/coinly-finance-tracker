import { describe, it, expect } from "vitest";
import { db } from "../db";
import { exchangeRateRepository as repo } from "./exchangeRateRepository";

// GROUP_C: exchangeRateRepository had NO test file (TEST_PLAN §5). Covers the upsert key and the
// two-query listLatestRates (newest date wins, all that date's quotes, per-base isolation).
describe("exchangeRateRepository.listLatestRates", () => {
  it("returns {} when nothing is cached for the base", async () => {
    expect(await repo.listLatestRates("EGP")).toEqual({});
  });

  it("returns only the most recent date's quotes, as a quote->rate map", async () => {
    await repo.upsert({ date: new Date("2026-01-10"), base: "EGP", quote: "USD", rate: 0.02 });
    await repo.upsert({ date: new Date("2026-01-15"), base: "EGP", quote: "USD", rate: 0.03 });
    await repo.upsert({ date: new Date("2026-01-15"), base: "EGP", quote: "EUR", rate: 0.04 });
    expect(await repo.listLatestRates("EGP")).toEqual({ USD: 0.03, EUR: 0.04 });
  });

  it("isolates by base currency", async () => {
    await repo.upsert({ date: new Date("2026-01-15"), base: "EGP", quote: "USD", rate: 0.03 });
    await repo.upsert({ date: new Date("2026-01-15"), base: "USD", quote: "EGP", rate: 49 });
    expect(await repo.listLatestRates("USD")).toEqual({ EGP: 49 });
  });
});

describe("exchangeRateRepository.upsert", () => {
  it("is idempotent on (date, base, quote) — a second upsert updates the rate, not inserts", async () => {
    const date = new Date("2026-02-01");
    await repo.upsert({ date, base: "EGP", quote: "USD", rate: 0.02 });
    await repo.upsert({ date, base: "EGP", quote: "USD", rate: 0.025 });
    expect(await db.exchangeRate.count()).toBe(1);
    expect((await repo.listLatestRates("EGP")).USD).toBe(0.025);
  });
});
