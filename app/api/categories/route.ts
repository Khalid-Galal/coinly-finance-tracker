import { seedDefaultTaxonomy } from "@/lib/server/categories/seed";
import { categoryRepository } from "@/lib/server/repositories/categoryRepository";
import { parseJson, apiError } from "@/lib/server/errors";

export async function GET() {
  await seedDefaultTaxonomy(); // first-run: ensure the default taxonomy exists
  return Response.json(await categoryRepository.list());
}

export async function POST(req: Request) {
  try {
    const { name, parentId } = await parseJson<{ name?: string; parentId?: string }>(req);
    return Response.json(await categoryRepository.create({ name: name ?? "", parentId }));
  } catch (e) {
    return apiError(e);
  }
}
