import { describe, it, expect } from "vitest";
import { getBaseCurrency, setBaseCurrency } from "./settingService";

describe("settingService base currency", () => {
  it("defaults to EGP when unset", async () => {
    expect(await getBaseCurrency()).toBe("EGP");
  });

  it("sets and reads back the base currency, normalizing case", async () => {
    expect(await setBaseCurrency("usd")).toBe("USD");
    expect(await getBaseCurrency()).toBe("USD");
  });

  it("upserts (a second set replaces, not duplicates)", async () => {
    await setBaseCurrency("USD");
    await setBaseCurrency("GBP");
    expect(await getBaseCurrency()).toBe("GBP");
  });

  it("rejects an invalid currency code", async () => {
    await expect(setBaseCurrency("US")).rejects.toThrow(/3-letter/);
    await expect(setBaseCurrency("US1")).rejects.toThrow(/3-letter/);
  });
});
