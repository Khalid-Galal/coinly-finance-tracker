import { describe, it, expect, afterEach } from "vitest";
import { db } from "@/lib/server/db";
import { recordLlmCall } from "@/lib/server/insights/costGuard";
import { GET, POST } from "./route";

// TEST_PLAN §3 Insights. The POST success path normally calls Gemini; we drive it through the
// deterministic fallback (cap exhausted) so the test never touches the network.
afterEach(() => {
  delete process.env.INSIGHT_DAILY_LLM_CAP;
});

function postReq(obj: unknown) {
  return new Request("http://t/api/insights", {
    method: "POST",
    body: JSON.stringify(obj),
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/insights", () => {
  it("200 with insights, usage, and anomalies on an empty DB", async () => {
    const r = await GET();
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.insights).toEqual([]);
    expect(body.usage).toMatchObject({
      used: 0,
      cap: expect.any(Number),
      remaining: expect.any(Number),
    });
    expect(Array.isArray(body.anomalies)).toBe(true);
  });

  it("returns persisted insights newest-first, capped at 10", async () => {
    for (let i = 0; i < 11; i++) {
      await db.insight.create({
        data: {
          periodStart: new Date("2026-06-01"),
          periodEnd: new Date("2026-07-01"),
          type: "weekly",
          content: `n${i}`,
          model: null,
          generatedAt: new Date(Date.UTC(2026, 5, i + 1)),
        },
      });
    }
    const body = await (await GET()).json();
    expect(body.insights).toHaveLength(10);
    expect(body.insights[0].content).toBe("n10"); // newest
  });
});

describe("POST /api/insights", () => {
  it("400 for an invalid or missing type", async () => {
    for (const t of [{ type: "yearly" }, {}, { type: "" }]) {
      expect((await POST(postReq(t))).status).toBe(400);
    }
  });

  it("200 and persists a record via the deterministic fallback when the cap is exhausted", async () => {
    process.env.INSIGHT_DAILY_LLM_CAP = "1";
    await recordLlmCall(); // exhaust today's cap so generateInsight skips the LLM call
    const r = await POST(postReq({ type: "weekly" }));
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.type).toBe("weekly");
    expect(body.model).toBeNull(); // fallback path -> no model recorded
    expect(await db.insight.count()).toBe(1);
  });

  it("400 on a malformed JSON body (parseJson -> ValidationError)", async () => {
    const req = new Request("http://t/api/insights", {
      method: "POST",
      body: "{bad",
      headers: { "content-type": "application/json" },
    });
    const r = await POST(req);
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/invalid JSON/);
  });
});
