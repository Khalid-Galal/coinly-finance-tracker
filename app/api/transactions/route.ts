import { transactionRepository } from "@/lib/server/repositories/transactionRepository";
import { transactionInputSchema } from "@/lib/shared/schemas";

export async function GET(req: Request) {
  const accountId = new URL(req.url).searchParams.get("accountId") ?? undefined;
  return Response.json(await transactionRepository.list({ accountId }));
}

export async function POST(req: Request) {
  const parsed = transactionInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  return Response.json(await transactionRepository.create(parsed.data), { status: 201 });
}
