import { z } from "zod";

/** Validated shape for creating/editing a transaction (FR-1.4). */
export const transactionInputSchema = z.object({
  accountId: z.string().min(1),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be ISO YYYY-MM-DD")
    .refine((d) => !Number.isNaN(Date.parse(d)), "date must be a valid calendar date"),
  amountMinor: z.number().int(),
  currency: z.string().length(3),
  description: z.string().min(1),
  payee: z.string().optional(),
  categoryId: z.string().optional(),
  source: z.enum(["csv", "manual", "voice"]).default("manual"),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;
