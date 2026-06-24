import { describe, it, expect } from "vitest";
import { checkPasscode } from "./passcode";

describe("checkPasscode", () => {
  it("passes when the provided value matches the configured passcode", () => {
    expect(checkPasscode("s3cret", "s3cret")).toBe(true);
  });

  it("fails when the value is missing or wrong", () => {
    expect(checkPasscode(null, "s3cret")).toBe(false);
    expect(checkPasscode("nope", "s3cret")).toBe(false);
  });

  it("passes everything when no passcode is configured (local dev)", () => {
    expect(checkPasscode(null, "")).toBe(true);
    expect(checkPasscode("anything", "")).toBe(true);
  });
});
