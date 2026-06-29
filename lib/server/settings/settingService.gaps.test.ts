import { describe, it, expect } from "vitest";
import { getBaseCurrency, setBaseCurrency } from "./settingService";

// GROUP_C gaps (TEST_PLAN §5 settingService): empty / non-alpha / padded codes, and that a
// rejected set never partially writes.
describe("setBaseCurrency — validation edges", () => {
  it("rejects empty, non-alpha, and wrong-length codes", async () => {
    await expect(setBaseCurrency("")).rejects.toThrow(/3-letter/);
    await expect(setBaseCurrency("123")).rejects.toThrow(/3-letter/);
    await expect(setBaseCurrency("US")).rejects.toThrow(/3-letter/);
    await expect(setBaseCurrency("USDD")).rejects.toThrow(/3-letter/);
    await expect(setBaseCurrency("US ")).rejects.toThrow(/3-letter/); // 2 letters after trim
  });

  it("trims surrounding whitespace before validating and storing", async () => {
    expect(await setBaseCurrency("  usd  ")).toBe("USD");
    expect(await getBaseCurrency()).toBe("USD");
  });

  it("a rejected set does not overwrite the existing value", async () => {
    await setBaseCurrency("USD");
    await expect(setBaseCurrency("US")).rejects.toThrow();
    expect(await getBaseCurrency()).toBe("USD");
  });

  it("accepts any 3-letter code — no ISO-4217 membership check (documented limitation)", async () => {
    expect(await setBaseCurrency("XYZ")).toBe("XYZ");
    expect(await getBaseCurrency()).toBe("XYZ");
  });
});
