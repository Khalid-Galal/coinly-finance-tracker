import { describe, it, expect } from "vitest";
import { transactionInputSchema } from "./schemas";

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
});
