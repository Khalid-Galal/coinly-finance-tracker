import { Parser } from "node-sql-parser";

const parser = new Parser();
const OPT = { database: "sqlite" } as const;

export type SqlValidation = { ok: true } | { ok: false; reason: string };

/**
 * Defense-in-depth guard for LLM-generated SQL: only a SINGLE read-only SELECT against
 * an allowlisted set of tables/views is permitted. Everything else (writes, DDL, multiple
 * statements, comments, unknown tables) is rejected BEFORE execution. (SRS §12.1, FR-6.3.)
 */
export function validateSql(sql: string, allowedTables: string[]): SqlValidation {
  // Reject comments outright — defeats comment-smuggling like `SELECT 1 -- ; DROP ...`.
  if (/--|\/\*|\*\//.test(sql)) return { ok: false, reason: "comments are not allowed" };

  let ast;
  try {
    ast = parser.astify(sql, OPT);
  } catch {
    return { ok: false, reason: "unparseable SQL" };
  }

  const statements = Array.isArray(ast) ? ast : [ast];
  if (statements.length !== 1) return { ok: false, reason: "only a single statement is allowed" };

  const type = (statements[0] as { type?: string }).type;
  if (type !== "select") return { ok: false, reason: `only SELECT is allowed (got ${type})` };

  const allowed = new Set(allowedTables.map((t) => t.toLowerCase()));
  // tableList entries look like "select::null::tablename"
  const referenced = parser
    .tableList(sql, OPT)
    .map((t) => (t.split("::").pop() ?? t).toLowerCase());
  for (const t of referenced) {
    if (!allowed.has(t)) return { ok: false, reason: `table not allowed: ${t}` };
  }
  return { ok: true };
}
