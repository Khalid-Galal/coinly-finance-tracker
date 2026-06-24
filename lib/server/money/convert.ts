/**
 * Convert an integer minor-unit amount using a from->to exchange rate.
 * Assumes both currencies use 2 decimal places (true for EGP/USD/EUR).
 * ponytail: 2dp assumption; revisit if a 0dp currency (e.g. JPY) is ever tracked.
 */
export function convertMinor(amountMinor: number, from: string, to: string, rate: number): number {
  if (from === to) return amountMinor;
  return Math.round(amountMinor * rate);
}
