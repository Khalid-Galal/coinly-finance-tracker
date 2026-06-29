import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "./route";

// Drive the gate via vi.stubEnv (APP_PASSCODE / NODE_ENV); unstub restores the real env per test.
// NODE_ENV is a read-only type, so stubEnv is the only type-safe way to flip it.
const post = (body: string) =>
  POST(
    new Request("http://test/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }),
  );
const cookieOf = (res: Response) => res.headers.get("set-cookie") ?? "";

beforeEach(() => {
  vi.stubEnv("APP_PASSCODE", "s3cret");
  vi.stubEnv("NODE_ENV", "test");
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
});
