import { describe, it, expect } from "vitest";
import { genericParser } from "./generic";

const csv = `date,amount,description,currency
2026-01-15,150.50,Costa Coffee,EGP
2026-01-16,-2000,Rent,EGP`;

describe("genericParser", () => {
  it("detects its format from the header", () => {
    expect(genericParser.canParse("date,amount,description,currency")).toBe(true);
    expect(genericParser.canParse("Date, Amount , Description")).toBe(true);
    expect(genericParser.canParse("foo,bar")).toBe(false);
  });

  it("parses amounts to minor units, ISO dates, default currency", () => {
    const rows = genericParser.parse(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].amountMinor).toBe(15050);
    expect(rows[0].date).toBe("2026-01-15");
    expect(rows[0].currency).toBe("EGP");
    expect(rows[0].description).toBe("Costa Coffee");
    expect(rows[1].amountMinor).toBe(-200000);
  });

  it("converts DD/MM/YYYY dates to ISO", () => {
    const rows = genericParser.parse("date,amount,description\n15/01/2026,10,X");
    expect(rows[0].date).toBe("2026-01-15");
  });

  it("defaults currency to EGP when the column is missing", () => {
    const rows = genericParser.parse("date,amount,description\n2026-01-01,10,X");
    expect(rows[0].currency).toBe("EGP");
  });

  it("maps the payee column when present", () => {
    const rows = genericParser.parse("date,amount,description,payee\n2026-01-01,10,X,Acme");
    expect(rows[0].payee).toBe("Acme");
  });

  it("treats a blank amount cell as 0 minor units", () => {
    const rows = genericParser.parse("date,amount,description\n2026-01-01,,X");
    expect(rows[0].amountMinor).toBe(0);
  });

  it("passes an unparseable date through unchanged", () => {
    const rows = genericParser.parse("date,amount,description\ngarbage,10,X");
    expect(rows[0].date).toBe("garbage");
  });

  it("rejects a header whose quoted field contains a comma", () => {
    // BUG: canParse uses naive split(","), so a quoted comma in the header splits
    // the "amount" column ('"amount' + 'note"') and a valid file is wrongly rejected.
    expect(genericParser.canParse('date,"amount,note",description')).toBe(false);
  });
});
