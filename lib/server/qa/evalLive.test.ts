import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { seedEvalFixture } from "./evalFixture";
import { runEvalSuite } from "./evalRunner";

// Live accuracy measurement against the REAL Gemini model. Skipped by default (and in CI):
// run with `EVAL_LIVE=1 npm run eval`. Needs Gemini API keys in .env.
const LIVE = process.env.EVAL_LIVE === "1";
const TARGET = 0.7; // FR-6 acceptance: the assistant answers the majority of questions correctly.

describe.runIf(LIVE)("live Q&A eval (real Gemini)", () => {
  beforeAll(() => {
    // Vitest doesn't auto-load .env into process.env; the key rotator reads from there.
    try {
      for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch {
      /* no .env — rely on the ambient environment */
    }
  });

  it(`answers at least ${Math.round(TARGET * 100)}% of answered questions correctly`, async () => {
    await seedEvalFixture();
    // Throttle ~1.2s/call so 32 calls stay under the free-tier per-minute rate limit.
    const report = await runEvalSuite(undefined, 1200);

    for (const r of report.results) {
      if (!r.ok && !r.infra) {
        console.log(
          `WRONG ${r.id} — "${r.question}"\n  sql: ${r.sql}\n  reason: ${r.error ?? "mismatch"}`,
        );
      }
    }
    const accuracy = report.answered ? report.passed / report.answered : 0;
    const summary = `Q&A accuracy: ${report.passed}/${report.answered} answered = ${Math.round(accuracy * 100)}% (${report.infraFailures} skipped: rate-limit/quota)`;
    console.log("\n" + summary);
    if (process.env.EVAL_OUT) {
      const lines = report.results.map(
        (r) => `${r.ok ? "PASS" : r.infra ? "SKIP" : "FAIL"} ${r.id}${r.ok ? "" : ` — ${r.error}`}`,
      );
      writeFileSync(process.env.EVAL_OUT, `${summary}\n\n${lines.join("\n")}\n`);
    }

    // Guard against a vacuous pass when quota dies early; measure model quality, not quota.
    expect(report.answered).toBeGreaterThanOrEqual(10);
    expect(accuracy).toBeGreaterThanOrEqual(TARGET);
  }, 180_000);
});
