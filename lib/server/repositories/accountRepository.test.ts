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

  it("orders list() by createdAt ascending", async () => {
    await accountRepository.create({
      name: "First",
      type: "bank",
      currency: "EGP",
      openingBalanceMinor: 0,
    });
    await accountRepository.create({
      name: "Second",
      type: "bank",
      currency: "EGP",
      openingBalanceMinor: 0,
    });
    const all = await accountRepository.list();
    expect(all).toHaveLength(2);
    expect(all[0].name).toBe("First");
    expect(all[1].name).toBe("Second");
  });

  it("get(id) returns the created account; get('nope') returns null", async () => {
    const created = await accountRepository.create({
      name: "Fetchable",
      type: "bank",
      currency: "EGP",
      openingBalanceMinor: 0,
    });
    const found = await accountRepository.get(created.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe("Fetchable");
    expect(await accountRepository.get("nope")).toBeNull();
  });
});
