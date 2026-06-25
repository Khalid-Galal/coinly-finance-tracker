import { Prisma } from "@prisma/client";

/** Thrown by services for bad client input — mapped to HTTP 400 (never leaks internals). */
export class ValidationError extends Error {}

/** Map a thrown error to a safe Response: 400 validation, 404 not-found, else 500 (logged). */
export function apiError(e: unknown): Response {
  if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  console.error(e);
  return Response.json({ error: "request failed" }, { status: 500 });
}

/** Parse a JSON body, turning malformed/empty input into a 400 ValidationError (not an opaque 500). */
export async function parseJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ValidationError("invalid JSON body");
  }
}
