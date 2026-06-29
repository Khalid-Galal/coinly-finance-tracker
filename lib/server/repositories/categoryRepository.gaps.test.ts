import { describe, it, expect } from "vitest";
import { db } from "../db";
import { categoryRepository } from "./categoryRepository";

// Incremental coverage over categoryRepository.test.ts — only the TEST_PLAN §5 Categories gaps
// that file doesn't already assert: color/icon passthrough, list() sort order, the no-guard
// archived rename, and rename of an unknown id (P2025).

describe("categoryRepository.create — passthrough", () => {
  it("persists color and icon", async () => {
    const c = await categoryRepository.create({ name: "Food", color: "#10b981", icon: "food" });
    expect(c).toMatchObject({ name: "Food", color: "#10b981", icon: "food" });
  });
});

describe("categoryRepository.list — ordering", () => {
  it("returns active categories sorted by name (asc)", async () => {
    await db.category.create({ data: { name: "Zoo" } });
    await db.category.create({ data: { name: "Apple" } });
    await db.category.create({ data: { name: "Mango" } });
    expect((await categoryRepository.list()).map((c) => c.name)).toEqual(["Apple", "Mango", "Zoo"]);
  });
});

describe("categoryRepository.rename", () => {
  it("renames an archived category without a guard (documents the sharp edge)", async () => {
    const c = await db.category.create({ data: { name: "Old", archivedAt: new Date() } });
    const renamed = await categoryRepository.rename(c.id, "New");
    expect(renamed.name).toBe("New");
    expect(renamed.archivedAt).toBeTruthy(); // still archived, just renamed — no guard
  });

  it("throws P2025 for an unknown id", async () => {
    await expect(categoryRepository.rename("ghost", "X")).rejects.toMatchObject({ code: "P2025" });
  });
});
