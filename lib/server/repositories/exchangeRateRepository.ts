import { db } from "../db";

export const exchangeRateRepository = {
  upsert(input: { date: Date; base: string; quote: string; rate: number }) {
    return db.exchangeRate.upsert({
      where: { date_base_quote: { date: input.date, base: input.base, quote: input.quote } },
      create: input,
      update: { rate: input.rate },
    });
  },

  /** Most recent cached rates for a base currency, as a quote -> rate map. */
  async listLatestRates(base: string): Promise<Record<string, number>> {
    const latest = await db.exchangeRate.findFirst({
      where: { base },
      orderBy: { date: "desc" },
    });
    if (!latest) return {};
    const rows = await db.exchangeRate.findMany({ where: { base, date: latest.date } });
    return Object.fromEntries(rows.map((r) => [r.quote, r.rate] as const));
  },
};
