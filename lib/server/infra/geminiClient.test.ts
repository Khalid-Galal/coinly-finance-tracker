import { describe, it, expect, vi, afterEach } from "vitest";
import { callGeminiOnce } from "./geminiClient";

afterEach(() => vi.unstubAllGlobals());

function mockFetch(
  impl: () => Promise<{ ok: boolean; status?: number; json: () => Promise<unknown> }>,
) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

describe("callGeminiOnce", () => {
  it("returns the text from a Gemini response", async () => {
    mockFetch(async () => ({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "hello" }] } }] }),
    }));
    expect(await callGeminiOnce("k", "hi")).toBe("hello");
  });

  it("throws with a status on a non-ok response (so the rotator can rotate)", async () => {
    mockFetch(async () => ({ ok: false, status: 429, json: async () => ({}) }));
    await expect(callGeminiOnce("k", "hi")).rejects.toMatchObject({ status: 429 });
  });

  it("throws on an empty/blocked response", async () => {
    mockFetch(async () => ({ ok: true, json: async () => ({ candidates: [] }) }));
    await expect(callGeminiOnce("k", "hi")).rejects.toThrow();
  });
});
