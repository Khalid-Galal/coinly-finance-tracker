import { createKeyRotator, type KeyRotator } from "./keyRotation";
import { loadGeminiKeys } from "./geminiKeys";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// gemini-2.5-flash chosen over the SRS's 2.0-flash: live probe showed 2.0-flash/-lite
// free quota exhausted across all keys, while 2.5-flash has quota. Override via GEMINI_MODEL.
const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export type GeminiOptions = { model?: string; temperature?: number };

/** One Gemini generateContent call with an explicit key. Throws with `.status` on HTTP error. */
export async function callGeminiOnce(
  key: string,
  prompt: string,
  opts: GeminiOptions = {},
): Promise<string> {
  const model = opts.model ?? DEFAULT_MODEL;
  const res = await fetch(`${API_BASE}/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: opts.temperature ?? 0 },
    }),
  });
  if (!res.ok) throw Object.assign(new Error(`Gemini API ${res.status}`), { status: res.status });
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text === undefined) throw new Error("Gemini API: empty response");
  return text;
}

let rotator: KeyRotator | null = null;
function getRotator(): KeyRotator {
  if (!rotator) rotator = createKeyRotator(loadGeminiKeys());
  return rotator;
}

/** Generate text from a prompt, rotating across configured keys on rate-limit/failure. */
export function geminiGenerateText(prompt: string, opts: GeminiOptions = {}): Promise<string> {
  return getRotator().run((key) => callGeminiOnce(key, prompt, opts));
}
