import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";

function postReq(obj: unknown) {
  return new Request("http://t/api/accounts", {
    method: "POST",
    body: JSON.stringify(obj),
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/accounts", () => {
  it("returns 200 and [] on an empty DB", async () => {
    const r = await GET();
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual([]);
  });
});

describe("POST /api/accounts", () => {
  it("creates an account with zod defaults (201)", async () => {
    const r = await POST(postReq({ name: "CIB" }));
    expect(r.status).toBe(201);
    const body = await r.json();
    expect(body.name).toBe("CIB");
    expect(body.type).toBe("bank");
    expect(body.currency).toBe("EGP");
    expect(body.openingBalanceMinor).toBe(0);
  });

  it("returns 400 with an error array when name is missing", async () => {
    const r = await POST(postReq({}));
    expect(r.status).toBe(400);
    const body = await r.json();
    expect(Array.isArray(body.error)).toBe(true);
  });

  it("returns 400 when currency is not exactly 3 chars", async () => {
    const r = await POST(postReq({ name: "X", currency: "US" }));
    expect(r.status).toBe(400);
  });

  it("returns 400 (not a throw/500) on a malformed JSON body", async () => {
    const req = new Request("http://t/api/accounts", {
      method: "POST",
      body: "{bad",
      headers: { "content-type": "application/json" },
    });
    const r = await POST(req);
    expect(r.status).toBe(400);
    expect((await r.json()).error).toBe("invalid JSON body");
  });
});
