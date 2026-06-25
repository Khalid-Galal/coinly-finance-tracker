import { describe, it, expect } from "vitest";
import { db } from "../db";
import { ruleRepository } from "./ruleRepository";

describe("ruleRepository", () => {
  it("creates a categorization rule and lists it", async () => {
    const cat = await db.category.create({ data: { name: "Dining" } });
    const rule = await ruleRepository.create({
      matchType: "merchant_exact",
      pattern: "COSTA",
      categoryId: cat.id,
    });

    expect(rule.pattern).toBe("COSTA");
    const all = await ruleRepository.list();
    expect(all).toHaveLength(1);
    expect(all[0].categoryId).toBe(cat.id);
  });
});
