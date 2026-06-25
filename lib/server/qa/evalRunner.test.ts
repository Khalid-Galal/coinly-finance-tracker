import { describe, it, expect, beforeEach } from "vitest";
import { askQuestion } from "./qaService";
import { EVAL_CASES } from "./evalSet";
import { seedEvalFixture } from "./evalFixture";
import { runEvalSuite, rowsMatch } from "./evalRunner";

const REF_BY_QUESTION = new Map(EVAL_CASES.map((c) => [c.question, c.referenceSql]));

/** A "perfect model": returns each case's own reference SQL through the real pipeline. */
const perfectAsk = (q: string) => askQuestion(q, async () => REF_BY_QUESTION.get(q) ?? "");

describe("rowsMatch", () => {
  it("matches regardless of column name or extra columns", () => {
    expect(rowsMatch([{ spent: 5000 }], [{ total: 5000 }])).toBe(true);
    expect(rowsMatch([{ spent: 5000 }], [{ total: 5000, label: "Dining" }])).toBe(true);
  });
  it("fails when an answer value is missing or wrong", () => {
    expect(rowsMatch([{ spent: 5000 }], [{ total: 4000 }])).toBe(false);
    expect(rowsMatch([{ a: 1 }, { a: 2 }], [{ a: 1 }])).toBe(false);
  });
});

describe("eval dataset integrity", () => {
  it("has at least 30 cases with unique ids", () => {
    expect(EVAL_CASES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(EVAL_CASES.map((c) => c.id)).size).toBe(EVAL_CASES.length);
  });
});

describe("runEvalSuite (deterministic, perfect model)", () => {
  beforeEach(seedEvalFixture);

  it("every reference query is allowlist-valid, executes, and scores correct", async () => {
    const report = await runEvalSuite(perfectAsk);
    const failures = report.results.filter((r) => !r.ok);
    // Surface any broken reference SQL with its reason if this ever regresses.
    expect(failures.map((f) => `${f.id}: ${f.error}`)).toEqual([]);
    expect(report.passed).toBe(report.total);
    expect(report.total).toBe(EVAL_CASES.length);
  });

  it("flags a wrong answer (the harness is not vacuously passing)", async () => {
    const target = EVAL_CASES[0];
    const ask = (q: string) =>
      q === target.question
        ? askQuestion(q, async () => "SELECT -1 AS wrong FROM v_transactions LIMIT 1")
        : perfectAsk(q);
    const report = await runEvalSuite(ask);
    const row = report.results.find((r) => r.id === target.id);
    expect(row?.ok).toBe(false);
    expect(report.passed).toBe(report.total - 1);
  });
});
