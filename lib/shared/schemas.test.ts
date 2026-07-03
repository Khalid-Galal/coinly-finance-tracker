import { describe, it, expect } from "vitest";
import { transactionInputSchema, budgetInputSchema } from "./schemas";

const valid = {
  accountId: "a1",
  date: "2026-01-15",
  amountMinor: 100,
  currency: "EGP",
  description: "Coffee",
};

describe("transactionInputSchema", () => {
  it("accepts a valid input and defaults source to manual", () => {
    const r = transactionInputSchema.parse(valid);
    expect(r.source).toBe("manual");
  });

  it("rejects a shape-valid but impossible calendar date", () => {
    expect(transactionInputSchema.safeParse({ ...valid, date: "2026-99-99" }).success).toBe(false);
  });

  it("rejects a non-3-letter currency and an empty description", () => {
    expect(transactionInputSchema.safeParse({ ...valid, currency: "EG" }).success).toBe(false);
    expect(transactionInputSchema.safeParse({ ...valid, description: "" }).success).toBe(false);
  });

  it("accepts a negative amount (expenses are negative) and rejects a float", () => {
    expect(transactionInputSchema.safeParse({ ...valid, amountMinor: -5000 }).success).toBe(true);
    expect(transactionInputSchema.safeParse({ ...valid, amountMinor: 1.5 }).success).toBe(false);
  });

  it("rejects an unknown source enum value", () => {
    expect(transactionInputSchema.safeParse({ ...valid, source: "import" }).success).toBe(false);
  });
});

const validBudget = {
  categoryId: "c1",
  month: "2026-07",
  amountMinor: 5000,
  currency: "EGP",
};

describe("budgetInputSchema", () => {
  it("accepts a valid budget", () => {
    expect(budgetInputSchema.safeParse(validBudget).success).toBe(true);
  });

  it("enforces the YYYY-MM month regex (rejects 00, 13, 1-digit, non-numeric)", () => {
    for (const month of ["2026-00", "2026-13", "2026-1", "abcd-01", "2026/07", "2026-07-01"]) {
      expect(budgetInputSchema.safeParse({ ...validBudget, month }).success).toBe(false);
    }
    for (const month of ["2026-01", "2026-09", "2026-12"]) {
      expect(budgetInputSchema.safeParse({ ...validBudget, month }).success).toBe(true);
    }
  });

  it("requires a positive integer amount (rejects 0, negative, float)", () => {
    for (const amountMinor of [0, -100, 1.5]) {
      expect(budgetInputSchema.safeParse({ ...validBudget, amountMinor }).success).toBe(false);
    }
  });

  it("requires a 3-letter currency and a non-empty categoryId", () => {
    expect(budgetInputSchema.safeParse({ ...validBudget, currency: "EG" }).success).toBe(false);
    expect(budgetInputSchema.safeParse({ ...validBudget, categoryId: "" }).success).toBe(false);
  });
});
