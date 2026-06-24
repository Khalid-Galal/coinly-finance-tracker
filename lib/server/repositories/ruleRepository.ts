import { db } from "../db";

export const ruleRepository = {
  list() {
    return db.categorizationRule.findMany();
  },
  create(input: { matchType: string; pattern: string; categoryId: string }) {
    return db.categorizationRule.create({ data: input });
  },
};
