import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "./route";
import { resetRateLimit } from "@/lib/server/rateLimit";

// Drive the gate via vi.stubEnv (APP_PASSCODE / NODE_ENV); unstub restores the real env per test.
// NODE_ENV is a read-only type, so stubEnv is the only type-safe way to flip it.
// `ip` lets a test isolate its own rate-limit bucket (default requests share "unknown").
const post = (body: string, ip?: string) =>
  POST(
    new Request("http://test/api/unlock", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(ip ? { "x-forwarded-for": ip } : {}),
      },
      body,
    }),
  );
const cookieOf = (res: Response) => res.headers.get("set-cookie") ?? "";

beforeEach(() => {
  vi.stubEnv("APP_PASSCODE", "s3cret");
  vi.stubEnv("NODE_ENV", "test");
  resetRateLimit(); // clear all rate-limit buckets so tests don't leak attempts into each other
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/unlock", () => {
  it("sets the unlock cookie on the correct passcode (200 + HttpOnly/Lax/Max-Age)", async () => {
    const res = await post(JSON.stringify({ passcode: "s3cret" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const cookie = cookieOf(res);
    expect(cookie).toMatch(/coinly_pass=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Max-Age=86400/i);
    expect(cookie).toMatch(/SameSite=lax/i);
  });

  it("returns 401 (not 400) on a wrong passcode, with no cookie", async () => {
    const res = await post(JSON.stringify({ passcode: "nope" }));
    expect(res.status).toBe(401);
    expect(cookieOf(res)).not.toMatch(/coinly_pass=/);
  });

  it("returns 401 on a missing, non-string, or malformed body", async () => {
    expect((await post(JSON.stringify({}))).status).toBe(401);
    expect((await post(JSON.stringify({ passcode: 1234 }))).status).toBe(401);
    expect((await post("{ broken")).status).toBe(401);
  });

  it("marks the cookie Secure only in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(cookieOf(await post(JSON.stringify({ passcode: "s3cret" })))).toMatch(/Secure/i);
    vi.stubEnv("NODE_ENV", "test");
    expect(cookieOf(await post(JSON.stringify({ passcode: "s3cret" })))).not.toMatch(/Secure/i);
  });

  it("unlocks with any passcode when APP_PASSCODE is empty (documented; proxy 503s the rest)", async () => {
    vi.stubEnv("APP_PASSCODE", "");
    expect((await post(JSON.stringify({ passcode: "whatever" }))).status).toBe(200);
  });

  it("rate-limits repeated wrong guesses from one IP (429 after 10 in a window)", async () => {
    const wrong = JSON.stringify({ passcode: "nope" });
    for (let i = 0; i < 10; i++) {
      expect((await post(wrong, "1.2.3.4")).status).toBe(401);
    }
    // 11th attempt in the window is blocked, and it's a 429 (not a 401) — no passcode check runs.
    expect((await post(wrong, "1.2.3.4")).status).toBe(429);
    // A different IP is unaffected (per-IP buckets).
    expect((await post(wrong, "5.6.7.8")).status).toBe(401);
  });

  it("a correct passcode resets the caller's attempt counter", async () => {
    const wrong = JSON.stringify({ passcode: "nope" });
    for (let i = 0; i < 9; i++) await post(wrong, "9.9.9.9");
    // Correct passcode succeeds and clears the counter...
    expect((await post(JSON.stringify({ passcode: "s3cret" }), "9.9.9.9")).status).toBe(200);
    // ...so the next 10 wrong guesses are allowed again rather than immediately 429ing.
    expect((await post(wrong, "9.9.9.9")).status).toBe(401);
  });
});
