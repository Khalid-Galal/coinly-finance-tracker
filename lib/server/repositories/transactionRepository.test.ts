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
});
