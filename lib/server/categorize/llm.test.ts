import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildCategorizationPrompt, parseCategorization, llmCategorizeBatch } from "./llm";
import { geminiGenerateText } from "../infra/geminiClient";

vi.mock("../infra/geminiClient", () => ({ geminiGenerateText: vi.fn() }));

const cats = ["Groceries", "Dining Out", "Uncategorized"];

beforeEach(() => vi.mocked(geminiGenerateText).mockReset());

describe("buildCategorizationPrompt", () => {
  it("includes the allowed categories and descriptions, not account numbers", () => {
    const p = buildCategorizationPrompt([{ description: "Costa", amountMinor: -1500 }], cats);
    expect(p).toContain("Groceries");
    expect(p).toContain("Costa");
    expect(p).toContain("-15.00");
  });
});

describe("parseCategorization", () => {
  it("parses a JSON array of category assignments", () => {
    const out = parseCategorization('[{"category":"Groceries","confidence":0.9}]', 1, cats);
    expect(out[0]).toEqual({ category: "Groceries", confidence: 0.9 });
  });

  it("tolerates markdown code fences", () => {
    const out = parseCategorization(
      '```json\n[{"category":"Dining Out","confidence":1}]\n```',
      1,
      cats,
    );
    expect(out[0].category).toBe("Dining Out");
  });

  it("defaults disallowed/missing entries to Uncategorized", () => {
    const out = parseCategorization('[{"category":"Nope","confidence":0.5}]', 2, cats);
    expect(out[0].category).toBe("Uncategorized");
    expect(out[1]).toEqual({ category: "Uncategorized", confidence: 0 });
  });
});

describe("llmCategorizeBatch", () => {
  it("maps the LLM reply back to one result per transaction", async () => {
    vi.mocked(geminiGenerateText).mockResolvedValue('[{"category":"Groceries","confidence":0.8}]');
    const out = await llmCategorizeBatch([{ description: "Spinneys", amountMinor: -5000 }], cats);
    expect(out).toEqual([{ category: "Groceries", confidence: 0.8 }]);
  });

  it("returns [] for an empty batch without calling the LLM", async () => {
    expect(await llmCategorizeBatch([], cats)).toEqual([]);
    expect(geminiGenerateText).not.toHaveBeenCalled();
  });
});
