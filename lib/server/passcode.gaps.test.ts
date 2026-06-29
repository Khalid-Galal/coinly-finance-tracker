import { describe, it, expect } from "vitest";
import { checkPasscode } from "./passcode";

// GROUP_C gaps (TEST_PLAN §5 gate, security-critical): exact-match semantics — case-sensitive,
// whitespace-significant, and an empty provided value is only accepted when no passcode is set.
describe("checkPasscode — exact-match semantics", () => {
  it("is case-sensitive", () => {
    expect(checkPasscode("ABC", "abc")).toBe(false);
    expect(checkPasscode("abc", "abc")).toBe(true);
  });

  it("treats surrounding whitespace as significant (no trimming)", () => {
    expect(checkPasscode("abc ", "abc")).toBe(false);
    expect(checkPasscode(" abc", "abc")).toBe(false);
  });

  it("rejects an empty provided value when a passcode IS configured", () => {
    expect(checkPasscode("", "s3cret")).toBe(false);
  });

  it("allows everything (incl. empty) only when no passcode is configured", () => {
    expect(checkPasscode("", "")).toBe(true);
    expect(checkPasscode(null, "")).toBe(true);
  });
});
