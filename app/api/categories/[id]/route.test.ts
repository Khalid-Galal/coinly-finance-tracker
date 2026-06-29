import { describe, it, expect } from "vitest";
import { db } from "@/lib/server/db";
import { PATCH, DELETE } from "./route";

// TEST_PLAN §3 Categories [id]. Both handlers route errors through apiError, so P2025 -> 404.
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
function patchReq(obj: unknown) {
  return new Request("http://t", {
    method: "PATCH",
    body: JSON.stringify(obj),
    headers: { "content-type": "application/json" },
  });
}

describe("PATCH /api/categories/[id]", () => {
  it("renames a category (200) and trims whitespace", async () => {
    const c = await db.category.create({ data: { name: "Food" } });
    const r = await PATCH(patchReq({ name: "  Dining  " }), ctx(c.id));
    expect(r.status).toBe(200);
    expect((await r.json()).name).toBe("Dining");
  });

  it("400 on an empty name", async () => {
    const c = await db.category.create({ data: { name: "Food" } });
    expect((await PATCH(patchReq({ name: "" }), ctx(c.id))).status).toBe(400);
  });

  it("400 on a duplicate name", async () => {
    await db.category.create({ data: { name: "Food" } });
    const c = await db.category.create({ data: { name: "Travel" } });
    expect((await PATCH(patchReq({ name: "food" }), ctx(c.id))).status).toBe(400);
  });

  it("404 for an unknown id (P2025 -> apiError 404)", async () => {
    expect((await PATCH(patchReq({ name: "X" }), ctx("ghost"))).status).toBe(404);
  });

  it("400 when renaming an archived category (guarded)", async () => {
    const c = await db.category.create({ data: { name: "Old", archivedAt: new Date() } });
    const r = await PATCH(patchReq({ name: "Renamed" }), ctx(c.id));
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/archived/);
  });
});

describe("DELETE /api/categories/[id]", () => {
  it("soft-archives a leaf category (200) and drops it from the active list", async () => {
    const c = await db.category.create({ data: { name: "Food" } });
    const r = await DELETE(new Request("http://t"), ctx(c.id));
    expect(r.status).toBe(200);
    expect((await r.json()).archivedAt).toBeTruthy();
    expect(await db.category.count({ where: { archivedAt: null } })).toBe(0);
  });

  it("400 when archiving a parent that still has live children", async () => {
    const parent = await db.category.create({ data: { name: "Food" } });
    await db.category.create({ data: { name: "Snacks", parentId: parent.id } });
    const r = await DELETE(new Request("http://t"), ctx(parent.id));
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/sub-categories/);
  });

  it("404 for an unknown id", async () => {
    expect((await DELETE(new Request("http://t"), ctx("ghost"))).status).toBe(404);
  });
});
