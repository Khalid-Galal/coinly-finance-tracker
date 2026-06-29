/**
 * Convert an integer minor-unit amount using a from->to exchange rate.
 * Assumes both currencies use 2 decimal places (true for EGP/USD/EUR).
 * ponytail: 2dp assumption; revisit if a 0dp currency (e.g. JPY) is ever tracked.
 */
export function convertMinor(amountMinor: number, from: string, to: string, rate: number): number {
  if (from === to) return amountMinor;
  // A usable FX rate is a finite positive number. Reject NaN/undefined (empty rate cache),
  // 0, and negatives LOUDLY — silently returning NaN or 0 here corrupts money downstream.
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`convertMinor: no usable exchange rate for ${from}->${to} (got ${rate})`);
  }
  return Math.round(amountMinor * rate);
}
