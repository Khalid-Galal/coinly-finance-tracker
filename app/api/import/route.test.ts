import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";
import { db } from "@/lib/server/db";

// Generic CSV the genericParser accepts: date,amount,description header + 2 data rows.
const csv = `date,amount,description
2026-01-15,150.50,Costa Coffee
2026-01-16,-2000,Rent`;

function importRequest(fd: FormData): Request {
  // No content-type header: FormData sets the multipart boundary itself.
  return new Request("http://t/api/import", { method: "POST", body: fd });
}

let accountId: string;

beforeEach(async () => {
  const acc = await db.account.create({
    data: { name: "CIB", type: "bank", currency: "EGP", openingBalanceMinor: 0 },
  });
  accountId = acc.id;
});

describe("POST /api/import", () => {
  it("imports a valid generic CSV against a real account", async () => {
    const fd = new FormData();
    fd.append("file", new File([csv], "x.csv", { type: "text/csv" }));
    fd.append("accountId", accountId);

    const r = await POST(importRequest(fd));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ imported: 2, skipped: 0 });
    expect(await db.transaction.count()).toBe(2);
  });

  it("rejects a request missing the file (only accountId present)", async () => {
    const fd = new FormData();
    fd.append("accountId", accountId);

    const r = await POST(importRequest(fd));
    expect(r.status).toBe(400);
    expect((await r.json()).error).toBe("file and accountId are required");
  });

  it("rejects an unsupported CSV header", async () => {
    const fd = new FormData();
    fd.append("file", new File(["foo,bar\n1,2"], "x.csv", { type: "text/csv" }));
    fd.append("accountId", accountId);

    const r = await POST(importRequest(fd));
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/unsupported/i);
  });

  it("returns 400 (not 500) when the accountId is a non-existent id", async () => {
    const fd = new FormData();
    fd.append("file", new File([csv], "x.csv", { type: "text/csv" }));
    fd.append("accountId", "nope");

    const r = await POST(importRequest(fd));
    // The route catches the Prisma FK throw and returns 400 with the raw message.
    expect(r.status).toBe(400);
    const body = await r.json();
    expect(typeof body.error).toBe("string");
    expect(body.error.length).toBeGreaterThan(0);
    // BUG: the raw Prisma FK error message is returned verbatim, leaking schema details to the client.
  });
});
