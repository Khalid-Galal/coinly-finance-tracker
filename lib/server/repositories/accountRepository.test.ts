import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db";
import { accountRepository } from "./accountRepository";

beforeEach(async () => {
  await db.account.deleteMany();
});

describe("accountRepository", () => {
  it("creates and lists an account", async () => {
    await accountRepository.create({
      name: "CIB Checking",
      type: "bank",
      currency: "EGP",
      openingBalanceMinor: 0,
    });
    const all = await accountRepository.list();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("CIB Checking");
  });

  it("excludes archived accounts from list()", async () => {
    const a = await accountRepository.create({
      name: "Old",
      type: "bank",
      currency: "EGP",
      openingBalanceMinor: 0,
    });
    await db.account.update({ where: { id: a.id }, data: { archivedAt: new Date() } });
    expect(await accountRepository.list()).toHaveLength(0);
  });
});
