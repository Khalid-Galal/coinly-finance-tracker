-- Read-only views for the guarded LLM-to-SQL Q&A pipeline (US-F1/F2).
-- The LLM may ONLY query these views (enforced by the SQL allowlist in
-- lib/server/qa/sqlAllowlist.ts). Dates are normalized to ISO text because
-- Prisma stores SQLite DateTime as epoch-milliseconds (integer), which would
-- silently mis-compare against the string date filters an LLM naturally writes.

CREATE VIEW "v_transactions" AS
SELECT
  t."id"                                            AS "id",
  date(t."date" / 1000, 'unixepoch')                AS "date",     -- 'YYYY-MM-DD'
  strftime('%Y-%m', t."date" / 1000, 'unixepoch')   AS "month",    -- 'YYYY-MM'
  t."amountMinor"                                   AS "amountMinor",  -- minor units; <0 expense, >0 income
  t."currency"                                      AS "currency",
  t."description"                                   AS "description",
  t."payee"                                         AS "payee",
  COALESCE(c."name", 'Uncategorized')               AS "category",
  a."name"                                          AS "account",
  t."source"                                        AS "source"
FROM "Transaction" t
LEFT JOIN "Category" c ON c."id" = t."categoryId"
LEFT JOIN "Account"  a ON a."id" = t."accountId";

CREATE VIEW "v_category_totals" AS
SELECT
  COALESCE(c."name", 'Uncategorized')                                   AS "category",
  strftime('%Y-%m', t."date" / 1000, 'unixepoch')                       AS "month",   -- 'YYYY-MM'
  COUNT(*)                                                              AS "txnCount",
  SUM(CASE WHEN t."amountMinor" < 0 THEN -t."amountMinor" ELSE 0 END)   AS "expenseMinor",  -- positive
  SUM(CASE WHEN t."amountMinor" > 0 THEN  t."amountMinor" ELSE 0 END)   AS "incomeMinor"    -- positive
FROM "Transaction" t
LEFT JOIN "Category" c ON c."id" = t."categoryId"
GROUP BY "category", "month";
