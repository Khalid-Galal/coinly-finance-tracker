import { Prisma } from "@prisma/client";
import { transactionRepository } from "@/lib/server/repositories/transactionRepository";
import { transactionInputSchema } from "@/lib/shared/schemas";
import { apiError, parseJson } from "@/lib/server/errors";

export async function GET(req: Request) {
  const accountId = new URL(req.url).searchParams.get("accountId") ?? undefined;
  return Response.json(await transactionRepository.list({ accountId }));
}

export async function POST(req: Request) {
  try {
    const parsed = transactionInputSchema.safeParse(await parseJson(req));
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    return Response.json(await transactionRepository.create(parsed.data), { status: 201 });
  } catch (e) {
    // A non-existent accountId is a foreign-key violation (P2003) — bad client input, so 400 not 500.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return Response.json(
        { error: "accountId does not reference an existing account" },
        { status: 400 },
      );
    }
    return apiError(e); // malformed JSON -> 400; else safe 500 (no leak)
  }
}
