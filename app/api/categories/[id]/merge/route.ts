import { categoryRepository } from "@/lib/server/repositories/categoryRepository";
import { parseJson, apiError, ValidationError } from "@/lib/server/errors";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: fromId } = await params;
    const { intoId } = await parseJson<{ intoId?: string }>(req);
    if (typeof intoId !== "string" || !intoId) throw new ValidationError("intoId is required");
    await categoryRepository.merge(fromId, intoId);
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
