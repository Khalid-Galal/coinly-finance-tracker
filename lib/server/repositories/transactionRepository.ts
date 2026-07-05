import { db } from "../db";
import { dedupeHash } from "../import/hash";
import type { TransactionInput } from "../../shared/schemas";

// Prisma CRUD repository for transactions: computes a dedupe hash on create and writes an
// audit-log entry for every create/update/delete.
async function writeAudit(
  entityId: string,
  action: string,
  before: unknown,
  after: unknown,
): Promise<void> {
  await db.auditLog.create({
    data: {
      entity: "transaction",
      entityId,
      action,
      beforeJson: before ? JSON.stringify(before) : null,
      afterJson: after ? JSON.stringify(after) : null,
    },
  });
}

export const transactionRepository = {
  async create(input: TransactionInput) {
    const tx = await db.transaction.create({
      data: {
        accountId: input.accountId,
        date: new Date(input.date),
        amountMinor: input.amountMinor,
        currency: input.currency,
        description: input.description,
        payee: input.payee,
        categoryId: input.categoryId,
        source: input.source,
        dedupeHash: dedupeHash(
          { date: input.date, amountMinor: input.amountMinor, description: input.description },
          input.accountId,
        ),
      },
    });
    await writeAudit(tx.id, "create", null, tx);
    return tx;
  },

  list(filter?: { accountId?: string }) {
    return db.transaction.findMany({
      where: { accountId: filter?.accountId },
      orderBy: { date: "desc" },
      include: { category: { select: { name: true } } },
    });
  },

  async update(id: string, patch: Partial<TransactionInput>) {
    const before = await db.transaction.findUnique({ where: { id } });
    const after = await db.transaction.update({
      where: { id },
      data: {
        amountMinor: patch.amountMinor,
        currency: patch.currency,
        description: patch.description,
        payee: patch.payee,
        categoryId: patch.categoryId,
        ...(patch.date ? { date: new Date(patch.date) } : {}),
      },
    });
    await writeAudit(id, "update", before, after);
    return after;
  },

  async remove(id: string) {
    const before = await db.transaction.findUnique({ where: { id } });
    await db.transaction.delete({ where: { id } });
    await writeAudit(id, "delete", before, null);
  },
};
