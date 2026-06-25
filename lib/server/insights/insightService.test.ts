import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { db } from "../db";

vi.mock("../infra/geminiClient", () => ({ geminiGenerateText: vi.fn() }));
import { geminiGenerateText } from "../infra/geminiClient";
import { generateInsight, getRecentInsights } from "./insightService";
import { recordLlmCall, getLlmUsage } from "./costGuard";

const mockGen = vi.mocked(geminiGenerateText);
const NOW = new Date("2026-06-24T10:00:00Z");

beforeEach(async () => {
  mockGen.mockReset();
  const acc = await db.account.create({ data: { name: "M", type: "bank", currency: "EGP" } });
  const dining = await db.category.create({ data: { name: "Dining" } });
  await db.transaction.create({
    data: {
      accountId: acc.id,
      date: new Date("2026-06-20"),
      amountMinor: -5000,
      currency: "EGP",
      description: "Costa",
      categoryId: dining.id,
      source: "manual",
      dedupeHash: "i-1",
    },
  });
});

afterEach(() => {
  delete process.env.INSIGHT_DAILY_LLM_CAP;
});

describe("generateInsight", () => {
  it("calls the LLM under the cap, persists the insight, and records the call", async () => {
    mockGen.mockResolvedValue("You spent a little on Dining this week. Keep it up!");
    const insight = await generateInsight("weekly", NOW);

    expect(mockGen).toHaveBeenCalledOnce();
    expect(insight).toMatchObject({ type: "weekly", content: expect.stringContaining("Dining") });
    expect(insight.model).toBeTruthy();
    expect((await getLlmUsage(NOW)).used).toBe(1);
    expect(await getRecentInsights()).toHaveLength(1);
  });

  it("falls back to a deterministic summary when the daily cap is reached (no LLM call)", async () => {
    process.env.INSIGHT_DAILY_LLM_CAP = "1";
    await recordLlmCall(NOW); // exhaust the cap

    const insight = await generateInsight("weekly", NOW);

    expect(mockGen).not.toHaveBeenCalled();
    expect(insight.model).toBeNull();
    expect(insight.content).toMatch(/income/i);
  });
});
