import { describe, it, expect } from "vitest";
import { PATCH } from "./route";
import { db } from "@/lib/server/db";

function patchReq(id: string, body: unknown) {
  return new Request(`http://localhost/api/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

async function seedAccount() {
  return db.account.create({
    data: { name: "CIB Checking", type: "bank", currency: "EGP" },
  });
}

async function seedTransaction(accountId: string, description = "  Starbucks Coffee  ") {
  return db.transaction.create({
    data: {
      accountId,
      date: new Date("2026-01-15"),
      amountMinor: 4500,
      currency: "EGP",
      description,
      source: "manual",
      dedupeHash: `hash-${Math.random()}`,
    },
  });
}

describe("PATCH /api/transactions/[id]", () => {
  it("applies a correction: sets categoryId and learns a merchant_exact rule", async () => {
    const account = await seedAccount();
    const tx = await seedTransaction(account.id);
    const cat = await db.category.create({ data: { name: "Dining" } });

    const r = await PATCH(patchReq(tx.id, { categoryId: cat.id }), {
      params: Promise.resolve({ id: tx.id }),
    });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });

    const updated = await db.transaction.findUnique({ where: { id: tx.id } });
    expect(updated?.categoryId).toBe(cat.id);

    // applyCorrection (FR-2.6) persists a merchant_exact rule directly via db (no LLM call).
    expect(await db.categorizationRule.count()).toBeGreaterThanOrEqual(1);
    const rules = await db.categorizationRule.findMany();
    expect(rules.some((rule) => rule.pattern === tx.description.toLowerCase().trim())).toBe(true);
    expect(rules.some((rule) => rule.matchType === "merchant_exact")).toBe(true);
  });

  it("returns 400 when the body is missing categoryId", async () => {
    const account = await seedAccount();
    const tx = await seedTransaction(account.id);

    const r = await PATCH(patchReq(tx.id, {}), {
      params: Promise.resolve({ id: tx.id }),
    });
    expect(r.status).toBe(400);
  });

  it("returns 404 for an unknown transaction id", async () => {
    const cat = await db.category.create({ data: { name: "Dining" } });

    const r = await PATCH(patchReq("nope", { categoryId: cat.id }), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(r.status).toBe(404);
    expect((await r.json()).error).toBe("not found");
  });

  it("returns 400 when categoryId references a non-existent category (FK)", async () => {
    const account = await seedAccount();
    const tx = await seedTransaction(account.id);

    const r = await PATCH(patchReq(tx.id, { categoryId: "does-not-exist" }), {
      params: Promise.resolve({ id: tx.id }),
    });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/category/i);
  });
});
