import { describe, it, expect } from "vitest";
import { db } from "../db";
import { seedDefaultTaxonomy } from "./seed";
import { DEFAULT_TAXONOMY } from "./defaultTaxonomy";

const expectedCount = DEFAULT_TAXONOMY.reduce((n, g) => n + 1 + g.children.length, 0);

describe("seedDefaultTaxonomy", () => {
  it("seeds the 2-level taxonomy with parents and children", async () => {
    const created = await seedDefaultTaxonomy();
    expect(created).toBe(expectedCount);
    expect(await db.category.count()).toBe(expectedCount);
    // children link to a parent
    const child = await db.category.findFirst({ where: { name: "Groceries" } });
    expect(child?.parentId).toBeTruthy();
  });

  it("is idempotent — does nothing when categories already exist", async () => {
    await seedDefaultTaxonomy();
    expect(await seedDefaultTaxonomy()).toBe(0);
    expect(await db.category.count()).toBe(expectedCount);
  });
});
