import { describe, it, expect, vi } from "vitest";
import { createKeyRotator, AllKeysFailedError } from "./keyRotation";

const httpError = (status: number) => Object.assign(new Error(`http ${status}`), { status });

describe("createKeyRotator", () => {
  it("uses the first key when it succeeds", async () => {
    const fn = vi.fn(async (k: string) => `ok:${k}`);
    expect(await createKeyRotator(["a", "b", "c"]).run(fn)).toBe("ok:a");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("rotates to the next key on a 429 rate-limit", async () => {
    const fn = vi.fn(async (k: string) => {
      if (k === "a") throw httpError(429);
      return `ok:${k}`;
    });
    expect(await createKeyRotator(["a", "b"]).run(fn)).toBe("ok:b");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("sticks with the last working key on the next call", async () => {
    const fn = vi.fn(async (k: string) => {
      if (k === "a") throw httpError(429);
      return `ok:${k}`;
    });
    const r = createKeyRotator(["a", "b"]);
    await r.run(fn); // lands on b
    fn.mockClear();
    expect(await r.run(fn)).toBe("ok:b"); // starts at b, no wasted call on a
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws AllKeysFailedError when every key fails", async () => {
    const fn = vi.fn(async () => {
      throw httpError(429);
    });
    await expect(createKeyRotator(["a", "b", "c"]).run(fn)).rejects.toBeInstanceOf(
      AllKeysFailedError,
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not rotate on a non-rotatable 400 error", async () => {
    const fn = vi.fn(async () => {
      throw httpError(400);
    });
    await expect(createKeyRotator(["a", "b"]).run(fn)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws if no keys are configured", () => {
    expect(() => createKeyRotator([])).toThrow(/no gemini api keys/i);
  });
});
