import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";
import { db } from "@/lib/server/db";

// Global setup wipes all tables before every test; each test only seeds what it needs.

function makeAccount(name = "Cash") {
  return db.account.create({
    data: { name, type: "cash", currency: "EGP", openingBalanceMinor: 0 },
  });
}

function postReq(body: Record<string, unknown>) {
  return new Request("http://t/api/transactions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/transactions", () => {
  it("creates a valid transaction -> 201 with a truthy id", async () => {
    const acc = await makeAccount();
    const r = await POST(
      postReq({
        accountId: acc.id,
        date: "2026-01-15",
        amountMinor: 15050,
        currency: "EGP",
        description: "Costa",
      }),
    );
    expect(r.status).toBe(201);
    const body = await r.json();
    expect(body.id).toBeTruthy();
  });

  it("rejects a float amountMinor -> 400 (schema .int())", async () => {
    const acc = await makeAccount();
    const r = await POST(
      postReq({
        accountId: acc.id,
        date: "2026-01-15",
        amountMinor: 15.5,
        currency: "EGP",
        description: "Costa",
      }),
    );
    expect(r.status).toBe(400);
  });

  it("rejects a 2-char currency -> 400 (schema .length(3))", async () => {
    const acc = await makeAccount();
    const r = await POST(
      postReq({
        accountId: acc.id,
        date: "2026-01-15",
        amountMinor: 100,
        currency: "EG",
        description: "Costa",
      }),
    );
    expect(r.status).toBe(400);
  });

  it("rejects an impossible calendar date 2026-13-01 -> 400 (refine)", async () => {
    const acc = await makeAccount();
    const r = await POST(
      postReq({
        accountId: acc.id,
        date: "2026-13-01",
        amountMinor: 100,
        currency: "EGP",
        description: "X",
      }),
    );
    expect(r.status).toBe(400);
  });

  it("rejects a non-zero-padded date 2026-1-5 -> 400 (regex)", async () => {
    const acc = await makeAccount();
    const r = await POST(
      postReq({
        accountId: acc.id,
        date: "2026-1-5",
        amountMinor: 100,
        currency: "EGP",
        description: "X",
      }),
    );
    expect(r.status).toBe(400);
  });

  it("returns 400 when accountId references a non-existent account (FK)", async () => {
    const req = postReq({
      accountId: "does-not-exist",
      date: "2026-01-15",
      amountMinor: 100,
      currency: "EGP",
      description: "X",
    });
    const r = await POST(req);
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/account/i);
  });

  it("returns 400 on a malformed JSON body", async () => {
    const req = new Request("http://t/api/transactions", { method: "POST", body: "{bad" });
    const r = await POST(req);
    expect(r.status).toBe(400);
    expect((await r.json()).error).toBe("invalid JSON body");
  });
});

describe("GET /api/transactions", () => {
  it("filters by accountId -> returns only that account's rows", async () => {
    const acc1 = await makeAccount("A1");
    const acc2 = await makeAccount("A2");
    await POST(
      postReq({
        accountId: acc1.id,
        date: "2026-01-15",
        amountMinor: 100,
        currency: "EGP",
        description: "one",
      }),
    );
    await POST(
      postReq({
        accountId: acc2.id,
        date: "2026-01-16",
        amountMinor: 200,
        currency: "EGP",
        description: "two",
      }),
    );
    const r = await GET(new Request("http://t/api/transactions?accountId=" + acc1.id));
    const body = await r.json();
    expect(body.length).toBe(1);
    expect(body[0].accountId).toBe(acc1.id);
  });
});
