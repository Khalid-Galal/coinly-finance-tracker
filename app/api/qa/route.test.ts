import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/lib/server/db";

// The route calls askQuestion(question) with the real Gemini client; mock it so the SQL is
// deterministic and no network is hit. qaService imports the same module, so the mock applies.
vi.mock("@/lib/server/infra/geminiClient", () => ({ geminiGenerateText: vi.fn() }));
import { geminiGenerateText } from "@/lib/server/infra/geminiClient";
import { POST } from "./route";

const mockGen = vi.mocked(geminiGenerateText);
const post = (body: string) =>
  POST(
    new Request("http://test/api/qa", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }),
  );

beforeEach(async () => {
  const acc = await db.account.create({ data: { name: "Main", type: "bank", currency: "EGP" } });
  await db.transaction.create({
    data: {
      accountId: acc.id,
      date: new Date("2026-03-01"),
      amountMinor: -5000,
      currency: "EGP",
      source: "manual",
      description: "Costa",
      dedupeHash: "qa-route-1",
    },
  });
});

describe("POST /api/qa", () => {
  it("answers a valid question (200, full QaResult shape)", async () => {
    mockGen.mockResolvedValue("SELECT COUNT(*) AS n FROM v_transactions");
    const res = await post(JSON.stringify({ question: "how many?" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.question).toBe("how many?");
    expect(body.sql).toContain("v_transactions");
    expect(body.answer).toBe("1"); // non-money scalar -> the value, no column label
    expect(body.error).toBeUndefined();
  });

  it("rejects a missing question with 400", async () => {
    const res = await post(JSON.stringify({}));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/question is required/i);
  });

  it("rejects a whitespace-only question with 400", async () => {
    const res = await post(JSON.stringify({ question: "   " }));
    expect(res.status).toBe(400);
  });

  it("rejects a non-string question with 400", async () => {
    const res = await post(JSON.stringify({ question: 5 }));
    expect(res.status).toBe(400);
  });

  it("returns 500 on a malformed JSON body", async () => {
    mockGen.mockResolvedValue("SELECT 1");
    const res = await post("{ not json");
    expect(res.status).toBe(500);
  });

  it("a rejected (unsafe) query is 200 with the error in the body — not a 4xx/5xx", async () => {
    mockGen.mockResolvedValue("DELETE FROM v_transactions");
    const res = await post(JSON.stringify({ question: "wipe my data" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error).toMatch(/rejected/i);
    expect(body.rows).toEqual([]);
    expect(await db.transaction.count()).toBe(1); // untouched
  });
});
