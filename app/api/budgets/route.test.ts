import { describe, it, expect } from "vitest";
import { db } from "@/lib/server/db";
import { GET, POST } from "./route";

// Route-handler integration tests (TEST_PLAN §3 Budgets). The passcode gate lives in proxy.ts and
// runs before these handlers, so it is asserted once in the e2e suite, not per route here.
function getReq(qs: string) {
  return new Request(`http://t/api/budgets${qs}`);
}
function postReq(obj: unknown) {
  return new Request("http://t/api/budgets", {
    method: "POST",
    body: JSON.stringify(obj),
    headers: { "content-type": "application/json" },
  });
}
async function category(name = "Food") {
  return (await db.category.create({ data: { name } })).id;
}

describe("GET /api/budgets", () => {
  it("400 when the month query is missing", async () => {
    expect((await GET(getReq(""))).status).toBe(400);
  });

  it("400 on a malformed month (regex)", async () => {
    for (const m of ["2026-13", "2026-00", "2026-1", "abcd-01"]) {
      expect((await GET(getReq(`?month=${m}`))).status).toBe(400);
    }
  });

  it("200 with [] for a month that has no budgets", async () => {
    const r = await GET(getReq("?month=2026-05"));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual([]);
  });

  it("200 with a progress row for an existing budget", async () => {
    const cat = await category();
    await db.budget.create({
      data: { categoryId: cat, month: "2026-05", amountMinor: 10000, currency: "EGP" },
    });
    const r = await GET(getReq("?month=2026-05"));
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      categoryName: "Food",
      budgetMinor: 10000,
      spentMinor: 0,
      status: "ok",
    });
  });
});

describe("POST /api/budgets", () => {
  it("upserts a budget (200) and is idempotent on (category, month)", async () => {
    const cat = await category();
    const r1 = await POST(
      postReq({ categoryId: cat, month: "2026-05", amountMinor: 5000, currency: "EGP" }),
    );
    expect(r1.status).toBe(200);
    const r2 = await POST(
      postReq({ categoryId: cat, month: "2026-05", amountMinor: 8000, currency: "EGP" }),
    );
    expect(r2.status).toBe(200);
    expect(await db.budget.count()).toBe(1);
    expect((await r2.json()).amountMinor).toBe(8000);
  });

  it("400 on invalid amounts (0, negative, float), short currency, blank category, bad month", async () => {
    const cat = await category();
    const bad = [
      { categoryId: cat, month: "2026-05", amountMinor: 0, currency: "EGP" },
      { categoryId: cat, month: "2026-05", amountMinor: -100, currency: "EGP" },
      { categoryId: cat, month: "2026-05", amountMinor: 1.5, currency: "EGP" },
      { categoryId: cat, month: "2026-05", amountMinor: 100, currency: "EG" },
      { categoryId: "", month: "2026-05", amountMinor: 100, currency: "EGP" },
      { categoryId: cat, month: "2026-13", amountMinor: 100, currency: "EGP" },
    ];
    for (const b of bad) expect((await POST(postReq(b))).status).toBe(400);
  });

  it("400 when categoryId references a non-existent category (FK P2003 -> apiError)", async () => {
    const r = await POST(
      postReq({ categoryId: "ghost", month: "2026-05", amountMinor: 100, currency: "EGP" }),
    );
    expect(r.status).toBe(400);
  });

  it("400 on a malformed JSON body (parseJson -> ValidationError)", async () => {
    const req = new Request("http://t/api/budgets", {
      method: "POST",
      body: "{bad",
      headers: { "content-type": "application/json" },
    });
    const r = await POST(req);
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/invalid JSON/);
  });
});
