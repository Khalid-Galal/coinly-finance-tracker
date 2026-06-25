import { categoryRepository } from "@/lib/server/repositories/categoryRepository";
import { parseJson, apiError } from "@/lib/server/errors";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { name } = await parseJson<{ name?: string }>(req);
    return Response.json(await categoryRepository.rename(id, name ?? ""));
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    return Response.json(await categoryRepository.archive(id));
  } catch (e) {
    return apiError(e);
  }
}
