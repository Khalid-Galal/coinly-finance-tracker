import { describe, it, expect } from "vitest";
import { db } from "@/lib/server/db";
import { POST } from "./route";

// TEST_PLAN §3 Categories merge. The repository already has thorough unit tests; here we assert
// the HTTP contract (status codes) and atomicity (a failed merge leaves the source untouched).
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
function mergeReq(intoId: unknown) {
  return new Request("http://t", {
    method: "POST",
    body: JSON.stringify({ intoId }),
    headers: { "content-type": "application/json" },
  });
}
async function cat(name: string) {
  return db.category.create({ data: { name } });
}
async function txn(accountId: string, categoryId: string, hash: string) {
  return db.transaction.create({
    data: {
      accountId,
      date: new Date("2026-05-10"),
      amountMinor: -1000,
      currency: "EGP",
      description: "x",
      source: "manual",
      categoryId,
      dedupeHash: hash,
    },
  });
}

describe("POST /api/categories/[id]/merge", () => {
  it("repoints transactions, rules, and budgets to the target, then archives the source (200)", async () => {
    const acc = (await db.account.create({ data: { name: "A", type: "bank", currency: "EGP" } })).id;
    const from = await cat("From");
    const to = await cat("To");
    await txn(acc, from.id, "t1");
    await db.categorizationRule.create({
      data: { matchType: "contains", pattern: "x", categoryId: from.id },
    });
    await db.budget.create({
      data: { categoryId: from.id, month: "2026-05", amountMinor: 5000, currency: "EGP" },
    });

    const r = await POST(mergeReq(to.id), ctx(from.id));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    expect(await db.transaction.count({ where: { categoryId: to.id } })).toBe(1);
    expect(await db.categorizationRule.count({ where: { categoryId: to.id } })).toBe(1);
    expect(await db.budget.count({ where: { categoryId: to.id, month: "2026-05" } })).toBe(1);
    expect((await db.category.findUnique({ where: { id: from.id } }))!.archivedAt).toBeTruthy();
  });

  it("400 when intoId is missing or empty", async () => {
    const from = await cat("From");
    expect((await POST(mergeReq(undefined), ctx(from.id))).status).toBe(400);
    expect((await POST(mergeReq(""), ctx(from.id))).status).toBe(400);
  });

  it("400 when merging a category into itself", async () => {
    const c = await cat("C");
    const r = await POST(mergeReq(c.id), ctx(c.id));
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/itself/);
  });

  it("400 when source or target does not exist", async () => {
    const c = await cat("C");
    expect((await POST(mergeReq("ghost"), ctx(c.id))).status).toBe(400); // target missing
    expect((await POST(mergeReq(c.id), ctx("ghost"))).status).toBe(400); // source missing
  });

  it("rolls back atomically — a failed merge leaves the source's transactions untouched", async () => {
    const acc = (await db.account.create({ data: { name: "A", type: "bank", currency: "EGP" } })).id;
    const from = await cat("From");
    await txn(acc, from.id, "t1");
    // Target archived -> validation throws INSIDE the $transaction (after the from===to guard),
    // before any updateMany runs. Nothing should be repointed and the source must stay active.
    const archivedTo = await db.category.create({ data: { name: "To", archivedAt: new Date() } });
    expect((await POST(mergeReq(archivedTo.id), ctx(from.id))).status).toBe(400);
    expect(await db.transaction.count({ where: { categoryId: from.id } })).toBe(1);
    expect((await db.category.findUnique({ where: { id: from.id } }))!.archivedAt).toBeNull();
  });
});
