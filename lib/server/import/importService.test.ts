import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db";
import { importCsv } from "./importService";

const csv = `date,amount,description,currency
2026-01-15,150.50,Costa Coffee,EGP
2026-01-16,-2000,Rent,EGP
2026-01-17,500,Refund,EGP`;

const BOM = String.fromCharCode(0xfeff);

// Generic CSV with two IDENTICAL data rows (same date/amount/description -> same dedupeHash).
const genericDupCsv = `date,amount,description,currency
2026-02-01,100,Lunch,EGP
2026-02-01,100,Lunch,EGP`;

// Generic header with no data rows.
const genericHeaderOnly = "date,amount,description,currency";

// Debit/Credit two-column bank export: one debit (money out) + one credit (money in).
const debitCreditCsv = `Date,Description,Debit,Credit,Balance
2026-03-01,ATM Withdrawal,50.00,,1000.00
2026-03-02,Salary,,5000.00,6000.00`;

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

  it("dedupes identical rows within a single file", async () => {
    expect(await importCsv(genericDupCsv, accountId)).toEqual({ imported: 1, skipped: 1 });
    expect(await db.transaction.count()).toBe(1);
  });

  it("imports nothing from a header-only file (no data rows)", async () => {
    expect(await importCsv(genericHeaderOnly, accountId)).toEqual({ imported: 0, skipped: 0 });
    expect(await db.transaction.count()).toBe(0);
  });

  it("rejects an empty string as unsupported", async () => {
    // An empty string has no header line, so no parser matches -> "Unsupported CSV format".
    await expect(importCsv("", accountId)).rejects.toThrow(/unsupported/i);
  });

  it("imports debit/credit rows with correct signs (debit negative, credit positive)", async () => {
    expect(await importCsv(debitCreditCsv, accountId)).toEqual({ imported: 2, skipped: 0 });
    const txns = await db.transaction.findMany({ where: { accountId } });
    const amounts = txns.map((t) => t.amountMinor);
    expect(amounts.filter((a) => a < 0)).toHaveLength(1); // debit -> negative
    expect(amounts.filter((a) => a > 0)).toHaveLength(1); // credit -> positive
  });

  it("rejects an import targeting a non-existent account (FK violation)", async () => {
    await expect(importCsv(csv, "does-not-exist")).rejects.toThrow();
  });
});
