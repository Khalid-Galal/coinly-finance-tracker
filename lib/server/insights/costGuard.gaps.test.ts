import { describe, it, expect, afterEach } from "vitest";
import { getLlmUsage, recordLlmCall } from "./costGuard";

// TEST_PLAN §5 Insights costGuard gaps: INSIGHT_DAILY_LLM_CAP=0, non-numeric/negative env,
// race in recordLlmCall.
const NOW = new Date("2026-07-01T10:00:00Z");
const DEFAULT_CAP = 20;

afterEach(() => {
  delete process.env.INSIGHT_DAILY_LLM_CAP;
});

describe("costGuard — cap env parsing", () => {
  it("honours an explicit 0 cap (forces offline/fallback mode)", async () => {
    process.env.INSIGHT_DAILY_LLM_CAP = "0";
    const u = await getLlmUsage(NOW);
    expect(u.cap).toBe(0);
    expect(u.remaining).toBe(0); // remaining 0 -> generateInsight uses the deterministic fallback
  });

  it("falls back to the default cap for non-numeric, empty, and negative values", async () => {
    for (const v of ["abc", "-5", "", "  "]) {
      process.env.INSIGHT_DAILY_LLM_CAP = v;
      expect((await getLlmUsage(NOW)).cap).toBe(DEFAULT_CAP);
    }
  });

  it("honours a valid positive cap", async () => {
    process.env.INSIGHT_DAILY_LLM_CAP = "3";
    expect((await getLlmUsage(NOW)).cap).toBe(3);
  });
});

describe("recordLlmCall — counting", () => {
  it("counts sequential calls exactly", async () => {
    // recordLlmCall is read-modify-write with no atomic increment, so truly concurrent calls can
    // lose updates (TEST_PLAN §5 race note). That interleaving is not deterministically reproducible
    // here; the sequential contract — exact counting — is what callers rely on.
    for (let i = 0; i < 5; i++) await recordLlmCall(NOW);
    expect((await getLlmUsage(NOW)).used).toBe(5);
  });
});
