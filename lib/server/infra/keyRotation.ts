export class AllKeysFailedError extends Error {
  constructor(
    readonly attempts: number,
    readonly lastError: unknown,
  ) {
    super(`All ${attempts} Gemini API key(s) failed`);
    this.name = "AllKeysFailedError";
  }
}

function statusOf(err: unknown): number | undefined {
  if (typeof err === "object" && err !== null) {
    const e = err as { status?: number; code?: number; response?: { status?: number } };
    return e.status ?? e.code ?? e.response?.status;
  }
  return undefined;
}

/**
 * Should this error make us try a DIFFERENT key?
 * - 400 bad request: no (another key won't help — the request is wrong)
 * - 401/403 (key rejected) / 429 (rate limited) / 5xx (transient): yes
 * - unknown/network errors: yes (resilience-first)
 */
export function isRotatableError(err: unknown): boolean {
  const s = statusOf(err);
  if (s === 400) return false;
  if (s === 401 || s === 403 || s === 429) return true;
  if (s !== undefined && s >= 500) return true;
  return true;
}

export type KeyRotator = {
  readonly keyCount: number;
  run<T>(fn: (key: string) => Promise<T>): Promise<T>;
};

/**
 * Calls `fn` with each key until one succeeds, rotating on rotatable errors.
 * Keeps a cursor on the last working key so the next call starts there — a
 * rate-limited key isn't re-hit on every request.
 */
export function createKeyRotator(keys: string[]): KeyRotator {
  if (keys.length === 0) throw new Error("No Gemini API keys configured");
  let cursor = 0;

  return {
    keyCount: keys.length,
    async run<T>(fn: (key: string) => Promise<T>): Promise<T> {
      let lastError: unknown;
      for (let attempt = 0; attempt < keys.length; attempt++) {
        const idx = (cursor + attempt) % keys.length;
        try {
          const result = await fn(keys[idx]);
          cursor = idx; // stick with the working key next time
          return result;
        } catch (err) {
          lastError = err;
          if (!isRotatableError(err)) throw err;
        }
      }
      cursor = (cursor + 1) % keys.length; // advance past the exhausted starting key
      throw new AllKeysFailedError(keys.length, lastError);
    },
  };
}
