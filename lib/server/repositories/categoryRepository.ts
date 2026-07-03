import { db } from "../db";
import { ValidationError } from "../errors";

const NAME_MAX = 100;

function cleanName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new ValidationError("name is required");
  if (trimmed.length > NAME_MAX) {
    throw new ValidationError(`name must be ${NAME_MAX} characters or fewer`);
  }
  return trimmed;
}

/** Reject a name that clashes (case-insensitive) with another active category. */
async function assertNameAvailable(name: string, excludeId?: string) {
  const lower = name.toLowerCase();
  const actives = await db.category.findMany({
    where: { archivedAt: null },
    select: { id: true, name: true },
  });
  if (actives.some((c) => c.id !== excludeId && c.name.toLowerCase() === lower)) {
    throw new ValidationError("a category with that name already exists");
  }
}

async function assertNoLiveChildren(id: string) {
  if ((await db.category.count({ where: { parentId: id, archivedAt: null } })) > 0) {
    throw new ValidationError("move or archive sub-categories first");
  }
}

export const categoryRepository = {
  async create(input: { name: string; parentId?: string; color?: string; icon?: string }) {
    const name = cleanName(input.name);
    await assertNameAvailable(name);
    if (input.parentId) {
      const parent = await db.category.findUnique({ where: { id: input.parentId } });
      if (!parent || parent.archivedAt) throw new ValidationError("parent category not found");
      if (parent.parentId)
        throw new ValidationError("categories can only be nested two levels deep");
    }
    return db.category.create({ data: { ...input, name } });
  },

  list() {
    return db.category.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" } });
  },

  async rename(id: string, rawName: string) {
    const name = cleanName(rawName);
    await assertNameAvailable(name, id);
    // Guard archived categories — renaming a hidden category is almost always a stale-UI mistake.
    // An unknown id falls through to update() and surfaces as P2025 (404), preserving that contract.
    const existing = await db.category.findUnique({ where: { id } });
    if (existing?.archivedAt) throw new ValidationError("cannot rename an archived category");
    return db.category.update({ where: { id }, data: { name } });
  },

  async archive(id: string) {
    await assertNoLiveChildren(id);
    return db.category.update({ where: { id }, data: { archivedAt: new Date() } });
  },

  /**
   * Merge `fromId` into `toId`: repoint transactions, rules, and budgets to the target, then
   * archive `fromId`. Runs in one transaction so a partial merge can't corrupt categorisation.
   * Both endpoints are validated (exist, correct archive state) up front — otherwise a source
   * with no rows would "merge" into a non-existent/archived target and silently vanish. Budgets
   * collide on the unique (category, month) key — when the target already has that month, the
   * source's budget is dropped (target wins).
   */
  async merge(fromId: string, toId: string) {
    if (fromId === toId) throw new ValidationError("cannot merge a category into itself");
    await db.$transaction(async (tx) => {
      const [from, to] = await Promise.all([
        tx.category.findUnique({ where: { id: fromId } }),
        tx.category.findUnique({ where: { id: toId } }),
      ]);
      if (!from) throw new ValidationError("source category not found");
      if (!to) throw new ValidationError("target category not found");
      if (from.archivedAt) throw new ValidationError("source category is already archived");
      if (to.archivedAt) throw new ValidationError("cannot merge into an archived category");
      if ((await tx.category.count({ where: { parentId: fromId, archivedAt: null } })) > 0) {
        throw new ValidationError("move or archive sub-categories before merging");
      }

      await tx.transaction.updateMany({
        where: { categoryId: fromId },
        data: { categoryId: toId },
      });
      await tx.categorizationRule.updateMany({
        where: { categoryId: fromId },
        data: { categoryId: toId },
      });

      const targetMonths = new Set(
        (await tx.budget.findMany({ where: { categoryId: toId }, select: { month: true } })).map(
          (b) => b.month,
        ),
      );
      for (const b of await tx.budget.findMany({ where: { categoryId: fromId } })) {
        if (targetMonths.has(b.month)) await tx.budget.delete({ where: { id: b.id } });
        else await tx.budget.update({ where: { id: b.id }, data: { categoryId: toId } });
      }

      await tx.category.update({ where: { id: fromId }, data: { archivedAt: new Date() } });
    });
  },
};
