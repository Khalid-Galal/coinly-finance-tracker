import { removeBudget } from "@/lib/server/budgets/budgetService";
import { apiError } from "@/lib/server/errors";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await removeBudget(id);
    return Response.json({ ok: true });
  } catch (e) {
    // Unknown id -> Prisma P2025 -> apiError maps to 404.
    return apiError(e);
  }
}
