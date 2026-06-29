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

  it("includes payee in parentheses when present", () => {
    const p = buildCategorizationPrompt(
      [{ description: "Costa", payee: "Cairo Branch", amountMinor: -1500 }],
      cats,
    );
    expect(p).toContain("(Cairo Branch)");
  });

  it("omits parentheses when payee is absent", () => {
    const p = buildCategorizationPrompt([{ description: "Costa", amountMinor: -1500 }], cats);
    expect(p).not.toContain("(");
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

  it("ignores extra LLM objects beyond the requested count", () => {
    const out = parseCategorization(
      '[{"category":"Groceries","confidence":1},{"category":"Dining Out","confidence":1}]',
      1,
      cats,
    );
    expect(out.length).toBe(1);
    expect(out[0]).toEqual({ category: "Groceries", confidence: 1 });
  });

  it("treats a non-array reply as all Uncategorized/0", () => {
    const out = parseCategorization('{"category":"Groceries"}', 2, cats);
    expect(out).toEqual([
      { category: "Uncategorized", confidence: 0 },
      { category: "Uncategorized", confidence: 0 },
    ]);
  });

  it("clamps confidence above 1 down to 1", () => {
    const out = parseCategorization('[{"category":"Groceries","confidence":5}]', 1, cats);
    expect(out[0].confidence).toBe(1);
  });

  it("clamps negative confidence up to 0", () => {
    const out = parseCategorization('[{"category":"Groceries","confidence":-2}]', 1, cats);
    expect(out[0].confidence).toBe(0);
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
