// In-memory fixed-window rate limiter.
// ponytail: per-process only — sufficient for the single-instance Render deploy; state resets on
// redeploy. Swap for Redis/Turso-backed counters only if the app ever scales horizontally.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Returns true if this call is within the limit for `key`, false if it should be blocked.
 * Fixed window: the first call starts a window of `windowMs`; up to `limit` calls are allowed
 * within it. `now` is injectable for deterministic tests.
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

/** Clears one key's counter (call on a successful auth) or all keys (test isolation). */
export function resetRateLimit(key?: string): void {
  if (key === undefined) buckets.clear();
  else buckets.delete(key);
}
