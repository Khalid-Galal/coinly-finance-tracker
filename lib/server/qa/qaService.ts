import { db } from "../db";
import { geminiGenerateText } from "../infra/geminiClient";
import { validateSql } from "./sqlAllowlist";
import { getBaseCurrency } from "../settings/settingService";

/** Views the LLM is allowed to query (mirrors prisma/migrations/.../qa_readonly_views). */
const ALLOWED_VIEWS = ["v_transactions", "v_category_totals"];

const SCHEMA_DOC = `You translate a personal-finance question into ONE read-only SQLite SELECT query.

Available read-only views (use ONLY these):

v_transactions — one row per transaction
  id           TEXT
  date         TEXT     -- 'YYYY-MM-DD'
  month        TEXT     -- 'YYYY-MM'
  amountMinor  INTEGER  -- money in MINOR units (1 EGP = 100). NEGATIVE = expense, POSITIVE = income
  currency     TEXT
  description  TEXT
  payee        TEXT
  category     TEXT     -- 'Uncategorized' when none assigned
  account      TEXT
  source       TEXT     -- 'csv' | 'manual' | 'voice'

v_category_totals — totals per category per month
  category     TEXT
  month        TEXT     -- 'YYYY-MM'
  txnCount     INTEGER
  expenseMinor INTEGER  -- total spent, positive, minor units
  incomeMinor  INTEGER  -- total received, positive, minor units

Rules:
- SELECT only. No INSERT/UPDATE/DELETE/DDL, no comments, no semicolons, no multiple statements.
- Reference ONLY the two views above. Never reference base tables.
- Amounts are already in minor units; do NOT divide by 100.
- When selecting a single money total, alias it with a name ending in 'Minor' (e.g. SUM(expenseMinor) AS totalMinor) so the app formats it as currency.
- Output ONLY the SQL query. No explanation, no markdown fences.`;

export type QaResult = {
  question: string;
  sql: string | null;
  rows: Record<string, unknown>[];
  answer: string;
  error?: string;
};

function buildPrompt(question: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${SCHEMA_DOC}

Today is ${today}. Resolve relative periods against it — "this month" is the current 'YYYY-MM', "last month" the previous one, "this year" the current year. Do not invent a month unrelated to today.

Question: ${question}
SQL:`;
}

/** Pull the bare SQL out of an LLM response: strip markdown fences and a trailing semicolon. */
export function extractSql(raw: string): string {
  let s = raw.trim();
  const fence = s.match(/```(?:sql)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  return s.replace(/;+\s*$/, "").trim();
}

/** SQLite aggregates can come back as BigInt; JSON/Response can't serialize those. */
function normalizeRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) out[k] = typeof v === "bigint" ? Number(v) : v;
    return out;
  });
}

/**
 * A short, deterministic natural answer (we never send result rows back to the LLM — data
 * minimization). A single money value reads as "EGP 4725.00"; a single non-money value is shown
 * as itself; anything wider is summarised with a count and rendered as a table by the UI.
 */
function formatAnswer(rows: Record<string, unknown>[], baseCurrency: string): string {
  if (rows.length === 0) return "No matching results.";
  if (rows.length === 1) {
    const entries = Object.entries(rows[0]);
    // An aggregate over a period/category with no data comes back as one row of NULLs
    // (e.g. SUM over zero rows) — say so plainly instead of showing a row of dashes.
    if (entries.every(([, v]) => v === null || v === undefined)) return "No matching results.";
    if (entries.length === 1) {
      const [key, v] = entries[0];
      // Money columns are minor units. Match "minor" anywhere in the name so an aggregate alias
      // like SUM(expenseMinor) — which doesn't END in "minor" — is still formatted as currency.
      if (typeof v === "number" && /minor/i.test(key)) {
        return `${baseCurrency} ${(v / 100).toFixed(2)}`;
      }
      return v === null || v === undefined ? "—" : String(v);
    }
  }
  return `${rows.length} result${rows.length === 1 ? "" : "s"}.`;
}

async function saveHistory(
  question: string,
  sql: string | null,
  rows: Record<string, unknown>[] | null,
) {
  // Best-effort: a logging failure must never break the answer.
  try {
    await db.qaHistory.create({
      data: { question, generatedSql: sql, resultJson: rows ? JSON.stringify(rows) : null },
    });
  } catch {
    /* ignore */
  }
}

/**
 * Validate SQL against the allowlist and execute it read-only, returning normalized rows.
 * Throws "Unsafe query rejected: ..." if the guard refuses it, "Query failed: ..." on a DB error.
 * The single choke point through which every LLM-generated query must pass.
 */
export async function runReadOnlySql(sql: string): Promise<Record<string, unknown>[]> {
  const valid = validateSql(sql, ALLOWED_VIEWS);
  if (!valid.ok) throw new Error(`Unsafe query rejected: ${valid.reason}`);
  try {
    return normalizeRows((await db.$queryRawUnsafe(sql)) as Record<string, unknown>[]);
  } catch (e) {
    throw new Error(`Query failed: ${(e as Error).message}`);
  }
}

/**
 * Guarded LLM-to-SQL: question -> generate SQL -> allowlist validation -> read-only
 * execution -> deterministic answer. The SQL is returned for transparency (US-F3).
 * `generate` is injectable so the eval harness can drive the pipeline with reference SQL.
 */
export async function askQuestion(
  question: string,
  generate: (prompt: string) => Promise<string> = geminiGenerateText,
): Promise<QaResult> {
  const q = question.trim();
  if (!q) return { question, sql: null, rows: [], answer: "", error: "Question is empty." };

  const sql = extractSql(await generate(buildPrompt(q)));
  try {
    const rows = await runReadOnlySql(sql);
    await saveHistory(q, sql, rows);
    const baseCurrency = await getBaseCurrency();
    return { question: q, sql, rows, answer: formatAnswer(rows, baseCurrency) };
  } catch (e) {
    await saveHistory(q, sql, null);
    return { question: q, sql, rows: [], answer: "", error: (e as Error).message };
  }
}
