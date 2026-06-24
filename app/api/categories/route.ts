import { seedDefaultTaxonomy } from "@/lib/server/categories/seed";
import { categoryRepository } from "@/lib/server/repositories/categoryRepository";

export async function GET() {
  await seedDefaultTaxonomy(); // first-run: ensure the default taxonomy exists
  return Response.json(await categoryRepository.list());
}
