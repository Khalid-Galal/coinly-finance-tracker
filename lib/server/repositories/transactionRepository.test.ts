import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db";
import { transactionRepository } from "./transactionRepository";

beforeEach(async () => {
  await db.auditLog.deleteMany();
  await db.transaction.deleteMany();
  await db.account.deleteMany();
});

function makeAccount() {
  return db.account.create({
    data: { name: "Cash", type: "cash", currency: "EGP", openingBalanceMinor: 0 },
  });
}

describe("transactionRepository", () => {
  it("creates a transaction and writes a create audit log", async () => {
    const acc = await makeAccount();
    const tx = await transactionRepository.create({
      accountId: acc.id,
      date: "2026-01-15",
      amountMinor: 15050,
      currency: "EGP",
      description: "Costa",
      source: "manual",
    });
    expect(tx.id).toBeTruthy();
    expect(await transactionRepository.list()).toHaveLength(1);
    const audits = await db.auditLog.findMany({ where: { action: "create" } });
    expect(audits).toHaveLength(1);
  });

  it("deletes a transaction and audits it", async () => {
    const acc = await makeAccount();
    const tx = await transactionRepository.create({
      accountId: acc.id,
      date: "2026-01-15",
      amountMinor: 100,
      currency: "EGP",
      description: "X",
      source: "manual",
    });
    await transactionRepository.remove(tx.id);
    expect(await transactionRepository.list()).toHaveLength(0);
    expect(await db.auditLog.findMany({ where: { action: "delete" } })).toHaveLength(1);
  });

  it("updates a field, writes an update audit, and returns the updated row", async () => {
    const acc = await makeAccount();
    const cat = await db.category.create({ data: { name: "Dining" } });
    const tx = await transactionRepository.create({
      accountId: acc.id,
      date: "2026-01-15",
      amountMinor: 100,
      currency: "EGP",
      description: "X",
      source: "manual",
    });
    const updated = await transactionRepository.update(tx.id, { categoryId: cat.id });
    expect(updated.categoryId).toBe(cat.id);
    expect(await db.auditLog.findMany({ where: { action: "update" } })).toHaveLength(1);
  });

  it("list({accountId}) filters by account", async () => {
    const acc1 = await db.account.create({
      data: { name: "A1", type: "cash", currency: "EGP", openingBalanceMinor: 0 },
    });
    const acc2 = await db.account.create({
      data: { name: "A2", type: "cash", currency: "EGP", openingBalanceMinor: 0 },
    });
    await transactionRepository.create({
      accountId: acc1.id,
      date: "2026-01-15",
      amountMinor: 100,
      currency: "EGP",
      description: "one",
      source: "manual",
    });
    await transactionRepository.create({
      accountId: acc2.id,
      date: "2026-01-16",
      amountMinor: 200,
      currency: "EGP",
      description: "two",
      source: "manual",
    });
    const rows = await transactionRepository.list({ accountId: acc1.id });
    expect(rows).toHaveLength(1);
    expect(rows[0].accountId).toBe(acc1.id);
  });

  it("list() includes the related category name", async () => {
    const acc = await makeAccount();
    const cat = await db.category.create({ data: { name: "Groceries" } });
    await transactionRepository.create({
      accountId: acc.id,
      date: "2026-01-15",
      amountMinor: 100,
      currency: "EGP",
      description: "X",
      categoryId: cat.id,
      source: "manual",
    });
    const rows = await transactionRepository.list();
    expect(rows[0].category?.name).toBe("Groceries");
  });
});
