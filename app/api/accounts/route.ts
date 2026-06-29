import { z } from "zod";
import { accountRepository } from "@/lib/server/repositories/accountRepository";
import { apiError, parseJson } from "@/lib/server/errors";

export async function GET() {
  return Response.json(await accountRepository.list());
}

const createSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1).default("bank"),
  currency: z.string().length(3).default("EGP"),
  openingBalanceMinor: z.number().int().default(0),
});

export async function POST(req: Request) {
  try {
    const parsed = createSchema.safeParse(await parseJson(req));
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues }, { status: 400 });
    }
    return Response.json(await accountRepository.create(parsed.data), { status: 201 });
  } catch (e) {
    return apiError(e); // malformed JSON -> 400; anything else -> safe 500 (no leak)
  }
}
