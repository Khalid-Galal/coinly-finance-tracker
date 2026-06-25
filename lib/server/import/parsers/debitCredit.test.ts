import { describe, it, expect } from "vitest";
import { debitCreditParser } from "./debitCredit";
import { genericParser } from "./generic";
import { pickParser } from "../registry";

describe("debitCreditParser.canParse", () => {
  it("claims headers with a date plus debit and credit columns", () => {
    expect(debitCreditParser.canParse("Date,Description,Debit,Credit,Balance")).toBe(true);
    expect(
      debitCreditParser.canParse("Transaction Date,Narrative,Withdrawal,Deposit,Balance"),
    ).toBe(true);
    expect(
      debitCreditParser.canParse("Value Date,Details,Debit Amount,Credit Amount,Currency"),
    ).toBe(true);
  });

  it("does not claim a single signed-amount export (that is the generic parser's)", () => {
    expect(debitCreditParser.canParse("date,amount,description")).toBe(false);
    expect(debitCreditParser.canParse("Date,Debit,Balance")).toBe(false); // credit missing
  });
});

describe("debitCreditParser.parse", () => {
  it("maps debit to negative and credit to positive minor units (CIB-style)", () => {
    const csv = [
      "Date,Description,Debit,Credit,Balance",
      "2026-03-05,Costa Coffee,50.00,,10000.00",
      "2026-03-28,Salary,,5000.00,15000.00",
    ].join("\n");
    const rows = debitCreditParser.parse(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      date: "2026-03-05",
      amountMinor: -5000,
      description: "Costa Coffee",
    });
    expect(rows[1]).toMatchObject({
      date: "2026-03-28",
      amountMinor: 500000,
      description: "Salary",
    });
  });

  it("handles DD/MM/YYYY dates, thousands separators, and alternate headers (Banque Misr-style)", () => {
    const csv = [
      "Transaction Date,Narrative,Withdrawal,Deposit",
      '15/03/2026,Carrefour Maadi,"1,250.50",',
      '29/03/2026,Transfer in,,"2,000.00"',
    ].join("\n");
    const rows = debitCreditParser.parse(csv);
    expect(rows[0]).toMatchObject({
      date: "2026-03-15",
      amountMinor: -125050,
      description: "Carrefour Maadi",
    });
    expect(rows[1]).toMatchObject({ date: "2026-03-29", amountMinor: 200000 });
  });

  it("reads a currency column and drops trailing summary/blank rows (NBE-style)", () => {
    const csv = [
      "Value Date,Details,Debit Amount,Credit Amount,Currency,Balance",
      "01/04/2026,Electricity bill,300.00,,EGP,9700.00",
      ",Closing balance,,,,9700.00",
    ].join("\n");
    const rows = debitCreditParser.parse(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      amountMinor: -30000,
      currency: "EGP",
      description: "Electricity bill",
    });
  });
});

describe("registry routing", () => {
  it("routes a debit/credit header to the debit/credit parser", () => {
    expect(pickParser("Date,Description,Debit,Credit,Balance")?.bank).toBe("debit-credit");
  });

  it("routes a signed-amount header to the generic parser", () => {
    expect(pickParser("date,amount,description")?.bank).toBe(genericParser.bank);
  });
});
