import { describe, it, expect } from "vitest";
import { db } from "@/lib/server/db";
import { DEFAULT_TAXONOMY } from "@/lib/server/categories/defaultTaxonomy";
import { GET, POST } from "./route";

// TEST_PLAN §3 Categories. Seed count is derived from the taxonomy (not hardcoded) so the test
// stays correct if the default taxonomy changes.
const SEED_COUNT = DEFAULT_TAXONOMY.reduce((n, g) => n + 1 + g.children.length, 0);

function postReq(obj: unknown) {
  return new Request("http://t/api/categories", {
    method: "POST",
    body: JSON.stringify(obj),
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/categories", () => {
  it("seeds the default taxonomy on first call and returns it sorted by name, idempotently", async () => {
    const r = await GET();
    expect(r.status).toBe(200);
    const body = (await r.json()) as { name: string }[];
    expect(body).toHaveLength(SEED_COUNT);
    const names = body.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    // second call is a no-op (seed is idempotent while actives exist)
    expect(await (await GET()).json()).toHaveLength(SEED_COUNT);
    expect(await db.category.count()).toBe(SEED_COUNT);
  });
});

describe("POST /api/categories", () => {
  it("creates a trimmed top-level category (200)", async () => {
    const r = await POST(postReq({ name: "  Groceries  " }));
    expect(r.status).toBe(200);
    expect((await r.json()).name).toBe("Groceries");
  });

  it("creates a child under a valid parent", async () => {
    const parent = await db.category.create({ data: { name: "Food" } });
    const r = await POST(postReq({ name: "Snacks", parentId: parent.id }));
    expect(r.status).toBe(200);
    expect((await r.json()).parentId).toBe(parent.id);
  });

  it("400 on a missing or blank name", async () => {
    expect((await POST(postReq({}))).status).toBe(400);
    expect((await POST(postReq({ name: "   " }))).status).toBe(400);
  });

  it("400 on a case-insensitive duplicate", async () => {
    await db.category.create({ data: { name: "Food" } });
    const r = await POST(postReq({ name: "food" }));
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/already exists/);
  });

  it("400 on a name longer than 100 chars", async () => {
    expect((await POST(postReq({ name: "x".repeat(101) }))).status).toBe(400);
  });

  it("400 when the parent is unknown or archived (parent not found)", async () => {
    // NOTE: TEST_PLAN flags non-UUID parentId as a 500, but Category.id is a plain cuid String in
    // SQLite — findUnique returns null for any missing id, so this is a clean 400, not a 500.
    expect((await POST(postReq({ name: "Child", parentId: "ghost" }))).status).toBe(400);
    const archived = await db.category.create({ data: { name: "Old", archivedAt: new Date() } });
    expect((await POST(postReq({ name: "Child2", parentId: archived.id }))).status).toBe(400);
  });

  it("400 when nesting more than two levels deep", async () => {
    const parent = await db.category.create({ data: { name: "P" } });
    const child = await db.category.create({ data: { name: "C", parentId: parent.id } });
    const r = await POST(postReq({ name: "GC", parentId: child.id }));
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/two levels deep/);
  });

  it("400 on a malformed JSON body (parseJson -> ValidationError, not an opaque 500)", async () => {
    const req = new Request("http://t/api/categories", {
      method: "POST",
      body: "{bad",
      headers: { "content-type": "application/json" },
    });
    const r = await POST(req);
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/invalid JSON/);
  });
});
