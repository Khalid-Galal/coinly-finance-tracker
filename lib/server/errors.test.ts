import { describe, it, expect, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { apiError, parseJson, ValidationError } from "./errors";

describe("apiError", () => {
  it("maps a ValidationError to 400 with its message", async () => {
    const res = apiError(new ValidationError("name is required"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "name is required" });
  });

  it("maps Prisma P2025 (record not found) to 404", async () => {
    const e = new Prisma.PrismaClientKnownRequestError("not found", {
      code: "P2025",
      clientVersion: "6.0.0",
    });
    const res = apiError(e);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not found" });
  });

  it("maps Prisma P2003 (foreign-key constraint) to 400", async () => {
    const e = new Prisma.PrismaClientKnownRequestError("FK failed", {
      code: "P2003",
      clientVersion: "6.0.0",
    });
    const res = apiError(e);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "referenced record does not exist" });
  });

  it("maps an unknown error to a generic 500 without leaking the message", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = apiError(new Error("DB exploded: secret connection string"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "request failed" });
    spy.mockRestore();
  });
});

describe("parseJson", () => {
  it("parses a valid JSON body", async () => {
    const req = new Request("http://x", { method: "POST", body: JSON.stringify({ a: 1 }) });
    expect(await parseJson<{ a: number }>(req)).toEqual({ a: 1 });
  });

  it("throws a ValidationError on malformed JSON", async () => {
    const req = new Request("http://x", { method: "POST", body: "{not json" });
    await expect(parseJson(req)).rejects.toBeInstanceOf(ValidationError);
  });
});
