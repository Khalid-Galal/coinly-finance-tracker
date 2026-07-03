import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { PASSCODE_COOKIE } from "@/lib/server/passcode";

// proxy() is a pure function of (request, env) — the app's only fail-closed control. The dev-server
// e2e can't reach the production-503 branch, so assert the whole gate here.
function req(path: string, opts: { cookie?: string; header?: string } = {}) {
  const headers = new Headers();
  if (opts.header) headers.set("x-passcode", opts.header);
  if (opts.cookie) headers.set("cookie", `${PASSCODE_COOKIE}=${opts.cookie}`);
  return new NextRequest(`http://test${path}`, { headers });
}
// proxy returns NextResponse.next() (status 200) when it lets a request through; anything else
// (redirect 307, 401, 503) is a block.
const passed = (path: string, opts?: { cookie?: string; header?: string }) =>
  proxy(req(path, opts)).status === 200;

beforeEach(() => {
  vi.stubEnv("APP_PASSCODE", "s3cret");
  vi.stubEnv("NODE_ENV", "test");
});
afterEach(() => vi.unstubAllEnvs());

describe("proxy gate", () => {
  it("lets the public routes through without a cookie", () => {
    for (const p of ["/unlock", "/api/unlock", "/api/health"]) expect(passed(p)).toBe(true);
  });

  it("treats a public-prefix subpath as public (/unlock/anything)", () => {
    expect(passed("/unlock/step2")).toBe(true);
  });

  it("redirects a locked page navigation to /unlock?next=…", () => {
    const res = proxy(req("/dashboard"));
    expect(res.status).toBe(307);
    const loc = res.headers.get("location") ?? "";
    expect(loc).toContain("/unlock");
    expect(loc).toContain("next=%2Fdashboard");
  });

  it("401s a locked /api/* request (no redirect for API callers)", () => {
    expect(proxy(req("/api/accounts")).status).toBe(401);
  });

  it("passes a request carrying the valid cookie or the x-passcode header", () => {
    expect(passed("/dashboard", { cookie: "s3cret" })).toBe(true);
    expect(passed("/api/accounts", { header: "s3cret" })).toBe(true);
  });

  it("rejects a wrong cookie", () => {
    expect(passed("/dashboard", { cookie: "nope" })).toBe(false);
  });

  it("fails CLOSED with 503 in production when APP_PASSCODE is unset", () => {
    vi.stubEnv("APP_PASSCODE", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(proxy(req("/dashboard")).status).toBe(503);
  });

  it("stays open in dev when APP_PASSCODE is unset (local convenience)", () => {
    vi.stubEnv("APP_PASSCODE", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(passed("/dashboard")).toBe(true);
  });
});
