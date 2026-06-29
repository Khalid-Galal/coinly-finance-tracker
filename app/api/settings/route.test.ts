import { describe, it, expect } from "vitest";
import { GET, PUT } from "./route";

const put = (body: string) =>
  PUT(
    new Request("http://test/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body,
    }),
  );

describe("GET /api/settings", () => {
  it("defaults to EGP when unset", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ baseCurrency: "EGP" });
  });
});

describe("PUT /api/settings", () => {
  it("saves and uppercases a valid code, and GET reflects it", async () => {
    const res = await put(JSON.stringify({ baseCurrency: "usd" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ baseCurrency: "USD" });
    expect(await (await GET()).json()).toEqual({ baseCurrency: "USD" });
  });

  it("rejects a 2-letter code with 400", async () => {
    const res = await put(JSON.stringify({ baseCurrency: "US" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/3-letter/);
  });

  it("rejects a missing baseCurrency with 400", async () => {
    const res = await put(JSON.stringify({}));
    expect(res.status).toBe(400);
  });

  it("maps a malformed JSON body to 400 'invalid JSON body' (not an opaque 500)", async () => {
    const res = await put("{ broken");
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid JSON body/i);
  });

  it("accepts any 3-letter code — no ISO-4217 check (documented)", async () => {
    const res = await put(JSON.stringify({ baseCurrency: "XYZ" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ baseCurrency: "XYZ" });
  });
});
