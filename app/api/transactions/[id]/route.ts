import { z } from "zod";
import { db } from "@/lib/server/db";
import { transactionRepository } from "@/lib/server/repositories/transactionRepository";
import { applyCorrection } from "@/lib/server/categorize/categorizeService";

const schema = z.object({ categoryId: z.string().min(1) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });

  const tx = await db.transaction.findUnique({ where: { id } });
  if (!tx) return Response.json({ error: "not found" }, { status: 404 });

  await transactionRepository.update(id, { categoryId: parsed.data.categoryId });
  await applyCorrection(tx.description, parsed.data.categoryId); // learn the rule (FR-2.6)
  return Response.json({ ok: true });
}
