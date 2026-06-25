import { db } from "../db";
import { ValidationError } from "../errors";

const BASE_CURRENCY_KEY = "baseCurrency";
const DEFAULT_BASE_CURRENCY = "EGP";

/** The user's base currency — the default for new entries and dashboard labels (US-G2). */
export async function getBaseCurrency(): Promise<string> {
  const row = await db.setting.findUnique({ where: { key: BASE_CURRENCY_KEY } });
  return row?.value ?? DEFAULT_BASE_CURRENCY;
}

/** Set the base currency. Accepts a 3-letter ISO-4217-style code (case-insensitive). */
export async function setBaseCurrency(code: string): Promise<string> {
  const value = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(value)) {
    throw new ValidationError("currency must be a 3-letter code (e.g. EGP, USD)");
  }
  await db.setting.upsert({
    where: { key: BASE_CURRENCY_KEY },
    create: { key: BASE_CURRENCY_KEY, value },
    update: { value },
  });
  return value;
}
