import { describe, it, expect } from "vitest";
import { matchByRules, type Rule } from "./rules";

const rules: Rule[] = [
  { matchType: "contains", pattern: "costa", categoryId: "dining" },
  { matchType: "merchant_exact", pattern: "uber", categoryId: "transport" },
];

describe("matchByRules", () => {
  it("matches a 'contains' rule anywhere in description/payee", () => {
    expect(matchByRules({ description: "COSTA COFFEE CAIRO" }, rules)).toBe("dining");
  });

  it("matches 'merchant_exact' only on the exact description", () => {
    expect(matchByRules({ description: "Uber" }, rules)).toBe("transport");
    expect(matchByRules({ description: "Uber Eats" }, rules)).toBeNull();
  });

  it("returns null when nothing matches", () => {
    expect(matchByRules({ description: "Random Shop" }, rules)).toBeNull();
  });

  it("matches a 'contains' rule against the payee (haystack includes payee)", () => {
    expect(
      matchByRules({ description: "POS 12345", payee: "Spinneys" }, [
        { matchType: "contains", pattern: "spinneys", categoryId: "groceries" },
      ]),
    ).toBe("groceries");
  });

  it("returns the first matching rule when rules overlap", () => {
    const overlapping: Rule[] = [
      { matchType: "contains", pattern: "shop", categoryId: "A" },
      { matchType: "contains", pattern: "coffee shop", categoryId: "B" },
    ];
    expect(matchByRules({ description: "Coffee Shop" }, overlapping)).toBe("A");
  });

  it("'merchant_exact' checks only the description and ignores the payee", () => {
    // payee "Uber Eats" is ignored; description exactly equals "uber" -> match
    expect(
      matchByRules({ description: "Uber", payee: "Uber Eats" }, [
        { matchType: "merchant_exact", pattern: "uber", categoryId: "t" },
      ]),
    ).toBe("t");
    // description "pay uber" is not an exact match and payee is not consulted -> null
    expect(
      matchByRules({ description: "Pay Uber", payee: "Uber" }, [
        { matchType: "merchant_exact", pattern: "uber", categoryId: "t" },
      ]),
    ).toBeNull();
  });

  it("returns null for an empty rules array", () => {
    expect(matchByRules({ description: "Anything" }, [])).toBeNull();
  });
});
