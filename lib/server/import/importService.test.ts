import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db";
import { importCsv } from "./importService";

const csv = `date,amount,description,currency
2026-01-15,150.50,Costa Coffee,EGP
2026-01-16,-2000,Rent,EGP
2026-01-17,500,Refund,EGP`;

const BOM = String.fromCharCode(0xfeff);

let accountId: string;

beforeEach(async () => {
  await db.auditLog.deleteMany();
  await db.transaction.deleteMany();
  await db.account.deleteMany();
  const acc = await db.account.create({
    data: { name: "CIB", type: "bank", currency: "EGP", openingBalanceMinor: 0 },
  });
  accountId = acc.id;
});

describe("importCsv", () => {
  it("imports all rows, then skips them all on re-import (dedupe-safe)", async () => {
    expect(await importCsv(csv, accountId)).toEqual({ imported: 3, skipped: 0 });
    expect(await importCsv(csv, accountId)).toEqual({ imported: 0, skipped: 3 });
    expect(await db.transaction.count()).toBe(3);
  });

  it("handles a UTF-8 BOM at the start of the file", async () => {
    expect(await importCsv(BOM + csv, accountId)).toEqual({ imported: 3, skipped: 0 });
  });

  it("rejects an unsupported format", async () => {
    await expect(importCsv("foo,bar\n1,2", accountId)).rejects.toThrow(/unsupported/i);
  });
});
