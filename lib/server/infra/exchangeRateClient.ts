import { exchangeRateRepository } from "../repositories/exchangeRateRepository";

const BASE_URL = process.env.EXCHANGE_RATE_BASE_URL ?? "https://open.er-api.com/v6";

export type RatesResult = { base: string; rates: Record<string, number>; source: "live" | "cache" };

/** Raw call to the free exchange-rate API: GET {BASE_URL}/latest/{base} -> { rates }. */
export async function fetchRatesFromApi(base: string): Promise<Record<string, number>> {
  const res = await fetch(`${BASE_URL}/latest/${base}`);
  if (!res.ok) throw new Error(`exchange-rate API responded ${res.status}`);
  const json = (await res.json()) as { rates?: Record<string, number> };
  if (!json.rates) throw new Error("exchange-rate API: missing rates");
  return json.rates;
}

/**
 * Fetch and persist `base` rates for `today`. Falls back to the most recent cached
 * rates if the API is unavailable (SRS §6.2 graceful degradation).
 */
export async function getRates(base: string, today: Date): Promise<RatesResult> {
  try {
    const rates = await fetchRatesFromApi(base);
    // Sequential upserts: SQLite serializes writes; concurrent upserts risk SQLITE_BUSY.
    for (const [quote, rate] of Object.entries(rates)) {
      await exchangeRateRepository.upsert({ date: today, base, quote, rate });
    }
    return { base, rates, source: "live" };
  } catch {
    return { base, rates: await exchangeRateRepository.listLatestRates(base), source: "cache" };
  }
}
