/**
 * Passcode gate for the deployed demo instance.
 * Returns true (allow) when no passcode is configured — local dev has no gate.
 */
export function checkPasscode(provided: string | null, configured: string): boolean {
  if (!configured) return true;
  return provided === configured;
}
