/**
 * Q&A evaluation set (US-F6): natural-language questions paired with a canonical, correct
 * "reference" SQL query over the read-only views. The reference query is the ground truth —
 * a model answer is scored correct when its result reproduces the reference's answer values
 * (see rowsMatch in evalRunner.ts). This decouples scoring from any single phrasing of the
 * query, and avoids hand-computed expected numbers that could drift from the fixture.
 *
 * All reference queries are answerable against seedEvalFixture() and pass the SQL allowlist.
 */
export type EvalCase = { id: string; question: string; referenceSql: string };

export const EVAL_CASES: EvalCase[] = [
  {
    id: "count-all",
    question: "How many transactions are there?",
    referenceSql: "SELECT COUNT(*) AS n FROM v_transactions",
  },
  {
    id: "spend-total",
    question: "How much did I spend in total?",
    referenceSql: "SELECT SUM(-amountMinor) AS spent FROM v_transactions WHERE amountMinor < 0",
  },
  {
    id: "income-total",
    question: "How much income did I receive in total?",
    referenceSql: "SELECT SUM(amountMinor) AS income FROM v_transactions WHERE amountMinor > 0",
  },
  {
    id: "net",
    question: "What is my net total — income minus spending?",
    referenceSql: "SELECT SUM(amountMinor) AS net FROM v_transactions",
  },
  {
    id: "spend-dining",
    question: "How much did I spend on Dining?",
    referenceSql:
      "SELECT SUM(expenseMinor) AS spent FROM v_category_totals WHERE category = 'Dining'",
  },
  {
    id: "spend-groceries",
    question: "How much did I spend on Groceries?",
    referenceSql:
      "SELECT SUM(expenseMinor) AS spent FROM v_category_totals WHERE category = 'Groceries'",
  },
  {
    id: "spend-transport",
    question: "How much did I spend on Transport in total?",
    referenceSql:
      "SELECT SUM(expenseMinor) AS spent FROM v_category_totals WHERE category = 'Transport'",
  },
  {
    id: "spend-utilities",
    question: "How much did I spend on Utilities?",
    referenceSql:
      "SELECT SUM(expenseMinor) AS spent FROM v_category_totals WHERE category = 'Utilities'",
  },
  {
    id: "spend-entertainment",
    question: "How much did I spend on Entertainment?",
    referenceSql:
      "SELECT SUM(expenseMinor) AS spent FROM v_category_totals WHERE category = 'Entertainment'",
  },
  {
    id: "top-category",
    question: "Which category did I spend the most on?",
    referenceSql:
      "SELECT category FROM v_category_totals GROUP BY category ORDER BY SUM(expenseMinor) DESC LIMIT 1",
  },
  {
    id: "spend-march",
    question: "How much did I spend in March 2026?",
    referenceSql:
      "SELECT SUM(expenseMinor) AS spent FROM v_category_totals WHERE month = '2026-03'",
  },
  {
    id: "spend-jan",
    question: "How much did I spend in January 2026?",
    referenceSql:
      "SELECT SUM(expenseMinor) AS spent FROM v_category_totals WHERE month = '2026-01'",
  },
  {
    id: "spend-feb",
    question: "How much did I spend in February 2026?",
    referenceSql:
      "SELECT SUM(expenseMinor) AS spent FROM v_category_totals WHERE month = '2026-02'",
  },
  {
    id: "count-march",
    question: "How many transactions did I have in March 2026?",
    referenceSql: "SELECT COUNT(*) AS n FROM v_transactions WHERE month = '2026-03'",
  },
  {
    id: "biggest-expense-amt",
    question: "What was my largest single expense?",
    referenceSql: "SELECT MAX(-amountMinor) AS biggest FROM v_transactions WHERE amountMinor < 0",
  },
  {
    id: "biggest-expense-desc",
    question: "What is my biggest expense and what was it for?",
    referenceSql:
      "SELECT description, -amountMinor AS amount FROM v_transactions WHERE amountMinor < 0 ORDER BY amountMinor ASC LIMIT 1",
  },
  {
    id: "top-3-expenses",
    question: "List my top 3 biggest expenses.",
    referenceSql:
      "SELECT description, -amountMinor AS amount FROM v_transactions WHERE amountMinor < 0 ORDER BY amountMinor ASC LIMIT 3",
  },
  {
    id: "spend-cash",
    question: "How much did I spend from my Cash account?",
    referenceSql:
      "SELECT SUM(-amountMinor) AS spent FROM v_transactions WHERE account = 'Cash' AND amountMinor < 0",
  },
  {
    id: "spend-cib",
    question: "How much did I spend on my CIB account?",
    referenceSql:
      "SELECT SUM(-amountMinor) AS spent FROM v_transactions WHERE account = 'CIB' AND amountMinor < 0",
  },
  {
    id: "count-accounts",
    question: "How many accounts have transactions?",
    referenceSql: "SELECT COUNT(DISTINCT account) AS n FROM v_transactions",
  },
  {
    id: "salary-total",
    question: "What is my total salary income?",
    referenceSql:
      "SELECT SUM(incomeMinor) AS salary FROM v_category_totals WHERE category = 'Salary'",
  },
  {
    id: "salary-count",
    question: "How many salary payments did I receive?",
    referenceSql: "SELECT COUNT(*) AS n FROM v_transactions WHERE category = 'Salary'",
  },
  {
    id: "count-uncategorized",
    question: "How many transactions are uncategorized?",
    referenceSql: "SELECT COUNT(*) AS n FROM v_transactions WHERE category = 'Uncategorized'",
  },
  {
    id: "dining-march",
    question: "How much did I spend on Dining in March 2026?",
    referenceSql:
      "SELECT SUM(expenseMinor) AS spent FROM v_category_totals WHERE category = 'Dining' AND month = '2026-03'",
  },
  {
    id: "groceries-april",
    question: "How much did I spend on Groceries in April 2026?",
    referenceSql:
      "SELECT SUM(expenseMinor) AS spent FROM v_category_totals WHERE category = 'Groceries' AND month = '2026-04'",
  },
  {
    id: "income-march",
    question: "How much did I earn in March 2026?",
    referenceSql:
      "SELECT SUM(incomeMinor) AS income FROM v_category_totals WHERE month = '2026-03'",
  },
  {
    id: "distinct-spend-cats",
    question: "How many different categories did I spend money on?",
    referenceSql:
      "SELECT COUNT(DISTINCT category) AS n FROM v_category_totals WHERE expenseMinor > 0",
  },
  {
    id: "list-spend-cats",
    question: "Which categories do I have spending in?",
    referenceSql: "SELECT DISTINCT category FROM v_category_totals WHERE expenseMinor > 0",
  },
  {
    id: "list-months",
    question: "Which months do I have transactions for?",
    referenceSql: "SELECT DISTINCT month FROM v_transactions",
  },
  {
    id: "count-expenses",
    question: "How many expense transactions are there?",
    referenceSql: "SELECT COUNT(*) AS n FROM v_transactions WHERE amountMinor < 0",
  },
  {
    id: "top-spend-month",
    question: "Which month did I spend the most?",
    referenceSql:
      "SELECT month FROM v_category_totals GROUP BY month ORDER BY SUM(expenseMinor) DESC LIMIT 1",
  },
  {
    id: "smallest-expense",
    question: "What was my smallest expense?",
    referenceSql: "SELECT MIN(-amountMinor) AS smallest FROM v_transactions WHERE amountMinor < 0",
  },
];
