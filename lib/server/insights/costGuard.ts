import { db } from "../db";

// US-D4: cap AI insight generation per day to control cost/quota. Count is persisted in the
// Setting table (one key per UTC day) so it survives restarts and is shared across instances.
const DEFAULT_DAILY_CAP = 20;

function dailyCap(): number {
  // Unset/empty/whitespace -> default. An explicit 0 is honoured (forces offline/fallback mode);
  // negative or non-numeric values are invalid and fall back to the default.
  const raw = process.env.INSIGHT_DAILY_LLM_CAP?.trim();
  if (!raw) return DEFAULT_DAILY_CAP;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_DAILY_CAP;
}

const dayKey = (now: Date) => `insight_llm_calls:${now.toISOString().slice(0, 10)}`;

export type LlmUsage = { used: number; cap: number; remaining: number };

export async function getLlmUsage(now: Date = new Date()): Promise<LlmUsage> {
  const row = await db.setting.findUnique({ where: { key: dayKey(now) } });
  const used = row ? Number(row.value) : 0;
  const cap = dailyCap();
  return { used, cap, remaining: Math.max(0, cap - used) };
}

export async function isUnderCap(now: Date = new Date()): Promise<boolean> {
  return (await getLlmUsage(now)).remaining > 0;
}

/** Increment today's AI-call counter. Call this only after a real LLM call is made. */
export async function recordLlmCall(now: Date = new Date()): Promise<void> {
  const key = dayKey(now);
  const row = await db.setting.findUnique({ where: { key } });
  const next = String((row ? Number(row.value) : 0) + 1);
  await db.setting.upsert({
    where: { key },
    create: { key, value: next },
    update: { value: next },
  });
}
