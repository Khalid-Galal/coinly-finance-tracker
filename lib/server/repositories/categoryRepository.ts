import { db } from "../db";

export const categoryRepository = {
  create(input: { name: string; parentId?: string; color?: string; icon?: string }) {
    return db.category.create({ data: input });
  },

  list() {
    return db.category.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" } });
  },

  rename(id: string, name: string) {
    return db.category.update({ where: { id }, data: { name } });
  },

  archive(id: string) {
    return db.category.update({ where: { id }, data: { archivedAt: new Date() } });
  },

  /** Merge `fromId` into `toId`: repoint transactions + rules, then archive `fromId`. */
  async merge(fromId: string, toId: string) {
    await db.transaction.updateMany({ where: { categoryId: fromId }, data: { categoryId: toId } });
    await db.categorizationRule.updateMany({
      where: { categoryId: fromId },
      data: { categoryId: toId },
    });
    await db.category.update({ where: { id: fromId }, data: { archivedAt: new Date() } });
  },
};
