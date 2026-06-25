import { describe, it, expect, afterEach } from "vitest";
import { getLlmUsage, recordLlmCall, isUnderCap } from "./costGuard";

const NOW = new Date("2026-06-24T10:00:00Z");

afterEach(() => {
  delete process.env.INSIGHT_DAILY_LLM_CAP;
});

describe("costGuard", () => {
  it("counts calls per day and reports remaining", async () => {
    expect(await getLlmUsage(NOW)).toMatchObject({ used: 0 });
    await recordLlmCall(NOW);
    await recordLlmCall(NOW);
    const u = await getLlmUsage(NOW);
    expect(u.used).toBe(2);
    expect(u.remaining).toBe(u.cap - 2);
  });

  it("enforces the configurable daily cap", async () => {
    process.env.INSIGHT_DAILY_LLM_CAP = "2";
    await recordLlmCall(NOW);
    expect(await isUnderCap(NOW)).toBe(true);
    await recordLlmCall(NOW);
    expect(await isUnderCap(NOW)).toBe(false);
    expect((await getLlmUsage(NOW)).remaining).toBe(0);
  });

  it("tracks each day independently", async () => {
    await recordLlmCall(NOW);
    expect((await getLlmUsage(new Date("2026-06-25T10:00:00Z"))).used).toBe(0);
  });
});
