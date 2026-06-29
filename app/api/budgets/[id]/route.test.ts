import { describe, it, expect } from "vitest";
import { db } from "@/lib/server/db";
import { DELETE } from "./route";

// TEST_PLAN §3 Budgets DELETE. The route routes errors through apiError, so an unknown id
// (Prisma P2025) maps to 404.
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("DELETE /api/budgets/[id]", () => {
  it("200 and removes an existing budget", async () => {
    const cat = (await db.category.create({ data: { name: "Food" } })).id;
    const b = await db.budget.create({
      data: { categoryId: cat, month: "2026-05", amountMinor: 5000, currency: "EGP" },
    });
    const r = await DELETE(new Request("http://t"), ctx(b.id));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    expect(await db.budget.count()).toBe(0);
  });

  it("404 for an unknown id — Prisma P2025 mapped via apiError", async () => {
    const r = await DELETE(new Request("http://t"), ctx("nope"));
    expect(r.status).toBe(404);
  });
});
