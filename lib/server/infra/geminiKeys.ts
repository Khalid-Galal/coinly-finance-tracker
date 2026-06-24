type Env = Record<string, string | undefined>;

/**
 * Collect Gemini API keys from the environment. Two formats are accepted (and combined):
 *   - GEMINI_API_KEY = comma/space/newline-separated list, and/or
 *   - GEMINI_API_KEY_1, GEMINI_API_KEY_2, ... (numbered, up to 50)
 * Returns trimmed, de-duplicated, non-empty keys.
 */
export function loadGeminiKeys(env: Env = process.env): string[] {
  const keys: string[] = [];

  for (const part of (env.GEMINI_API_KEY ?? "").split(/[,\s]+/)) {
    if (part.trim()) keys.push(part.trim());
  }
  for (let i = 1; i <= 50; i++) {
    const k = env[`GEMINI_API_KEY_${i}`];
    if (k && k.trim()) keys.push(k.trim());
  }

  return [...new Set(keys)];
}
