import { createHash, timingSafeEqual } from "node:crypto";

/** Cookie set by /api/unlock and checked by the proxy gate. */
export const PASSCODE_COOKIE = "coinly_pass";

/**
 * Passcode gate for the deployed demo instance.
 * Returns true (allow) when no passcode is configured — local dev has no gate.
 */
export function checkPasscode(provided: string | null, configured: string): boolean {
  if (!configured) return true;
  if (provided === null) return false;
  // Hash both sides to equal-length digests so timingSafeEqual leaks neither length nor content.
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(provided), digest(configured));
}
