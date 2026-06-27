/** Cookie set by /api/unlock and checked by the proxy gate. */
export const PASSCODE_COOKIE = "coinly_pass";

/**
 * Passcode gate for the deployed demo instance.
 * Returns true (allow) when no passcode is configured — local dev has no gate.
 */
export function checkPasscode(provided: string | null, configured: string): boolean {
  if (!configured) return true;
  return provided === configured;
}
