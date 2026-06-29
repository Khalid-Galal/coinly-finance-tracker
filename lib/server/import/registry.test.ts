import { describe, it, expect } from "vitest";
import { pickParser } from "./registry";

describe("pickParser", () => {
  it("selects the generic parser for a single signed-amount header", () => {
    expect(pickParser("date,amount,description")?.bank).toBe("generic");
  });

  it("selects the debit-credit parser for a two-column debit/credit header", () => {
    expect(pickParser("Date,Description,Debit,Credit,Balance")?.bank).toBe("debit-credit");
  });

  it("prefers debit-credit over generic when a header matches both", () => {
    // most-specific-first: debitCredit is ordered before generic in the registry and wins
    // even though generic (date,amount,description) also matches this header.
    expect(pickParser("date,amount,description,debit,credit")?.bank).toBe("debit-credit");
  });

  it("returns undefined when no parser claims the header", () => {
    expect(pickParser("foo,bar")).toBeUndefined();
  });
});
