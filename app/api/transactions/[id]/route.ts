import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { transactionRepository } from "@/lib/server/repositories/transactionRepository";
import { applyCorrection } from "@/lib/server/categorize/categorizeService";
import { apiError, parseJson } from "@/lib/server/errors";

const schema = z.object({ categoryId: z.string().min(1) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsed = schema.safeParse(await parseJson(req));
    if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });

    const tx = await db.transaction.findUnique({ where: { id } });
    if (!tx) return Response.json({ error: "not found" }, { status: 404 });

    await transactionRepository.update(id, { categoryId: parsed.data.categoryId });
    await applyCorrection(tx.description, parsed.data.categoryId); // learn the rule (FR-2.6)
    return Response.json({ ok: true });
  } catch (e) {
    // A non-existent categoryId is a foreign-key violation (P2003) — bad client input, so 400 not 500.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return Response.json(
        { error: "categoryId does not reference an existing category" },
        { status: 400 },
      );
    }
    return apiError(e); // malformed JSON -> 400; else safe 500 (no leak)
  }
}
