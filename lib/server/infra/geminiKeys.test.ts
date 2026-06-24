import { describe, it, expect } from "vitest";
import { loadGeminiKeys } from "./geminiKeys";

describe("loadGeminiKeys", () => {
  it("splits a comma-separated GEMINI_API_KEY", () => {
    expect(loadGeminiKeys({ GEMINI_API_KEY: "a, b ,c" })).toEqual(["a", "b", "c"]);
  });

  it("collects numbered GEMINI_API_KEY_N vars", () => {
    expect(loadGeminiKeys({ GEMINI_API_KEY_1: "a", GEMINI_API_KEY_2: "b" })).toEqual(["a", "b"]);
  });

  it("combines both formats, dedupes, and drops blanks", () => {
    expect(
      loadGeminiKeys({ GEMINI_API_KEY: "a,a, ,b", GEMINI_API_KEY_1: "b", GEMINI_API_KEY_2: "c" }),
    ).toEqual(["a", "b", "c"]);
  });

  it("returns an empty list when nothing is configured", () => {
    expect(loadGeminiKeys({})).toEqual([]);
  });
});
