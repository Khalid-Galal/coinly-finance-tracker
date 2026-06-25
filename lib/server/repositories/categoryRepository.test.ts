import { describe, it, expect } from "vitest";
import { db } from "../db";
import { categoryRepository } from "./categoryRepository";
import { seedDefaultTaxonomy } from "../categories/seed";

async function account() {
  return db.account.create({
    data: { name: "Cash", type: "cash", currency: "EGP", openingBalanceMinor: 0 },
  });
}

describe("categoryRepository", () => {
  it("excludes archived categories from list()", async () => {
    const c = await categoryRepository.create({ name: "Temp" });
    await categoryRepository.archive(c.id);
    expect((await categoryRepository.list()).find((x) => x.id === c.id)).toBeUndefined();
  });

  it("merge repoints transactions to the target and archives the source", async () => {
    const acc = await account();
    const from = await categoryRepository.create({ name: "Dining" });
    const to = await categoryRepository.create({ name: "Food" });
    await db.transaction.create({
      data: {
        accountId: acc.id,
        date: new Date("2026-01-01"),
        amountMinor: -1000,
        currency: "EGP",
        description: "Costa",
        source: "manual",
        categoryId: from.id,
        dedupeHash: "h1",
      },
    });

    await categoryRepository.merge(from.id, to.id);

    const tx = await db.transaction.findFirst({ where: { description: "Costa" } });
    expect(tx?.categoryId).toBe(to.id);
    const archived = await db.category.findUnique({ where: { id: from.id } });
    expect(archived?.archivedAt).not.toBeNull();
  });

  it("merge repoints budgets and resolves the (category, month) conflict (target wins)", async () => {
    const from = await categoryRepository.create({ name: "Dining" });
    const to = await categoryRepository.create({ name: "Food" });
    // Same month on both -> conflict (target kept); a non-overlapping month -> repointed.
    await db.budget.create({
      data: { categoryId: from.id, month: "2026-03", amountMinor: 5000, currency: "EGP" },
    });
    await db.budget.create({
      data: { categoryId: to.id, month: "2026-03", amountMinor: 9000, currency: "EGP" },
    });
    await db.budget.create({
      data: { categoryId: from.id, month: "2026-04", amountMinor: 7000, currency: "EGP" },
    });

    await categoryRepository.merge(from.id, to.id);

    const toBudgets = await db.budget.findMany({
      where: { categoryId: to.id },
      orderBy: { month: "asc" },
    });
    expect(toBudgets.map((b) => `${b.month}:${b.amountMinor}`)).toEqual([
      "2026-03:9000",
      "2026-04:7000",
    ]);
    expect(await db.budget.count({ where: { categoryId: from.id } })).toBe(0);
  });

  it("refuses to merge a category into itself", async () => {
    const c = await categoryRepository.create({ name: "Solo" });
    await expect(categoryRepository.merge(c.id, c.id)).rejects.toThrow(/itself/);
  });

  it("rejects merge into a missing or archived target, and from an archived source", async () => {
    const a = await categoryRepository.create({ name: "A" });
    const b = await categoryRepository.create({ name: "B" });
    await expect(categoryRepository.merge(a.id, "nope")).rejects.toThrow(
      /target category not found/,
    );
    await categoryRepository.archive(b.id);
    await expect(categoryRepository.merge(a.id, b.id)).rejects.toThrow(/archived category/);
    await categoryRepository.archive(a.id);
    const c = await categoryRepository.create({ name: "C" });
    await expect(categoryRepository.merge(a.id, c.id)).rejects.toThrow(/already archived/);
  });

  it("refuses to archive or merge a category that still has sub-categories", async () => {
    const parent = await categoryRepository.create({ name: "Food" });
    await categoryRepository.create({ name: "Dining", parentId: parent.id });
    const other = await categoryRepository.create({ name: "Misc" });
    await expect(categoryRepository.archive(parent.id)).rejects.toThrow(/sub-categories/);
    await expect(categoryRepository.merge(parent.id, other.id)).rejects.toThrow(/sub-categories/);
  });

  it("rejects duplicate active names (case-insensitive) and over-long names", async () => {
    await categoryRepository.create({ name: "Food" });
    await expect(categoryRepository.create({ name: "food" })).rejects.toThrow(/already exists/);
    const travel = await categoryRepository.create({ name: "Travel" });
    await expect(categoryRepository.rename(travel.id, "FOOD")).rejects.toThrow(/already exists/);
    await expect(categoryRepository.create({ name: "x".repeat(101) })).rejects.toThrow(/100/);
  });

  it("rejects a parent that is missing or already a child (two-level taxonomy)", async () => {
    const parent = await categoryRepository.create({ name: "Food" });
    const child = await categoryRepository.create({ name: "Dining", parentId: parent.id });
    await expect(categoryRepository.create({ name: "X", parentId: "missing" })).rejects.toThrow(
      /parent category not found/,
    );
    await expect(categoryRepository.create({ name: "Y", parentId: child.id })).rejects.toThrow(
      /two levels/,
    );
  });

  it("re-seeds the default taxonomy only when no active categories remain", async () => {
    expect(await seedDefaultTaxonomy()).toBeGreaterThan(0);
    expect(await seedDefaultTaxonomy()).toBe(0); // idempotent while actives exist
    for (const c of await db.category.findMany()) {
      await db.category.update({ where: { id: c.id }, data: { archivedAt: new Date() } });
    }
    expect(await seedDefaultTaxonomy()).toBeGreaterThan(0); // recovers from a fully-archived state
  });
});
