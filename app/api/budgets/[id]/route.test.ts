import { describe, it, expect } from "vitest";
import { db } from "@/lib/server/db";
import { DELETE } from "./route";

// TEST_PLAN §3 Budgets DELETE. This route uses its own try/catch (not apiError), so even a
// P2025 not-found surfaces as 500 rather than 404 — asserted below as a documented sharp edge.
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

  it("500 (not 404) for an unknown id — Prisma P2025 is caught generically", async () => {
    const r = await DELETE(new Request("http://t"), ctx("nope"));
    expect(r.status).toBe(500);
  });
});
