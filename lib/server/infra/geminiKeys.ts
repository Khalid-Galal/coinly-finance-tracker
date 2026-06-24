type Env = Record<string, string | undefined>;

/**
 * Collect Gemini API keys from the environment. Accepted (and combined):
 *   - GEMINI_API_KEY / GEMINI_API_KEYS / GOOGLE_API_KEYS = comma/space-separated list(s)
 *   - GEMINI_API_KEY_1, GEMINI_API_KEY_2, ... (numbered, up to 50)
 * Returns trimmed, de-duplicated, non-empty keys.
 */
export function loadGeminiKeys(env: Env = process.env): string[] {
  const keys: string[] = [];

  for (const list of [env.GEMINI_API_KEY, env.GEMINI_API_KEYS, env.GOOGLE_API_KEYS]) {
    for (const part of (list ?? "").split(/[,\s]+/)) {
      if (part.trim()) keys.push(part.trim());
    }
  }
  for (let i = 1; i <= 50; i++) {
    const k = env[`GEMINI_API_KEY_${i}`];
    if (k && k.trim()) keys.push(k.trim());
  }

  return [...new Set(keys)];
}
