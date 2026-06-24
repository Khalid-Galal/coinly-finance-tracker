import { db } from "../db";

export type AccountInput = {
  name: string;
  type: string;
  currency: string;
  openingBalanceMinor: number;
};

export const accountRepository = {
  create: (input: AccountInput) => db.account.create({ data: input }),
  list: () =>
    db.account.findMany({ where: { archivedAt: null }, orderBy: { createdAt: "asc" } }),
  get: (id: string) => db.account.findUnique({ where: { id } }),
};
