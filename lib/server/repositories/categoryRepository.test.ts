import { describe, it, expect } from "vitest";
import { db } from "../db";
import { categoryRepository } from "./categoryRepository";

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
});
