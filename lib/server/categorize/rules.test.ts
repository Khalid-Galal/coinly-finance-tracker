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
});
