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
});
