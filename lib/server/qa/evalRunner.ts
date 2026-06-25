import { askQuestion, runReadOnlySql, type QaResult } from "./qaService";
import { EVAL_CASES } from "./evalSet";

export type EvalRunResult = {
  id: string;
  question: string;
  ok: boolean;
  sql: string | null;
  error?: string;
  infra: boolean; // failure was rate-limit / network exhaustion, not a wrong model answer
};

export type EvalReport = {
  total: number;
  answered: number; // total minus infra failures — the denominator for accuracy
  passed: number;
  infraFailures: number;
  results: EvalRunResult[];
};

/** A quota/rate-limit/network failure — not the model getting the answer wrong. */
function isInfraError(message: string): boolean {
  return /key\(s\) failed|rate.?limit|quota|fetch failed|network|ENOTFOUND|ETIMEDOUT|429|503/i.test(
    message,
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Every primitive cell value across all rows, stringified for type-agnostic comparison. */
function primitiveValues(rows: Record<string, unknown>[]): string[] {
  const out: string[] = [];
  for (const row of rows) for (const v of Object.values(row)) out.push(String(v));
  return out;
}

/**
 * A candidate result is "correct" when it reproduces every answer value of the reference,
 * as a multiset (so a candidate may add columns/rows, but must not miss or change an answer).
 * This rewards semantically-equivalent SQL regardless of column naming or ordering.
 */
export function rowsMatch(
  reference: Record<string, unknown>[],
  candidate: Record<string, unknown>[],
): boolean {
  const counts = new Map<string, number>();
  for (const v of primitiveValues(candidate)) counts.set(v, (counts.get(v) ?? 0) + 1);
  for (const v of primitiveValues(reference)) {
    const n = counts.get(v) ?? 0;
    if (n === 0) return false;
    counts.set(v, n - 1);
  }
  return true;
}

/**
 * Run the whole eval set. `ask` defaults to the live pipeline (real Gemini); the deterministic
 * CI test injects a "perfect model" that returns each case's reference SQL. Requires the eval
 * fixture to be seeded first (seedEvalFixture).
 */
export async function runEvalSuite(
  ask: (question: string) => Promise<QaResult> = (q) => askQuestion(q),
  delayMs = 0,
): Promise<EvalReport> {
  const results: EvalRunResult[] = [];
  for (const c of EVAL_CASES) {
    let ok = false;
    let sql: string | null = null;
    let error: string | undefined;
    try {
      const reference = await runReadOnlySql(c.referenceSql);
      const candidate = await ask(c.question);
      sql = candidate.sql;
      if (candidate.error) error = candidate.error;
      else if (!rowsMatch(reference, candidate.rows)) error = "answer mismatch";
      else ok = true;
    } catch (e) {
      error = (e as Error).message;
    }
    results.push({
      id: c.id,
      question: c.question,
      ok,
      sql,
      error,
      infra: !!error && isInfraError(error),
    });
    if (delayMs) await sleep(delayMs);
  }
  const infraFailures = results.filter((r) => r.infra).length;
  return {
    total: results.length,
    answered: results.length - infraFailures,
    passed: results.filter((r) => r.ok).length,
    infraFailures,
    results,
  };
}
