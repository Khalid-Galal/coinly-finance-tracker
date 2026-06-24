import { db } from "../db";
import { DEFAULT_TAXONOMY } from "./defaultTaxonomy";

/** Idempotent: seeds the default taxonomy only when no categories exist yet. Returns rows created. */
export async function seedDefaultTaxonomy(): Promise<number> {
  if ((await db.category.count()) > 0) return 0;
  let created = 0;
  for (const group of DEFAULT_TAXONOMY) {
    const parent = await db.category.create({ data: { name: group.parent } });
    created++;
    for (const child of group.children) {
      await db.category.create({ data: { name: child, parentId: parent.id } });
      created++;
    }
  }
  return created;
}
