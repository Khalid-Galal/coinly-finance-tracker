# Q&A Evaluation Set (US-F6)

How we measure whether the natural-language Q&A feature (US-F1) actually answers questions
correctly — not just whether it runs.

## The set

[`lib/server/qa/evalSet.ts`](../lib/server/qa/evalSet.ts) holds **32 questions** spanning the
query shapes a user would ask: totals, per-category and per-month spend, counts, income vs.
expense, min/max, top-N, account filters, uncategorized, and "which category/month" rankings.

Each case pairs a natural-language `question` with a **reference SQL** query — the canonical,
correct way to answer it over the read-only views. The reference query is the ground truth.

## How a model answer is scored

We do **not** hard-code expected numbers (they would drift from the fixture and be error-prone).
Instead, for each question we:

1. Execute the **reference SQL** to get the true answer values.
2. Run the question through the real pipeline (`askQuestion` → Gemini → allowlist → execute).
3. Score **correct** when the model's result reproduces every answer value of the reference, as a
   multiset (`rowsMatch` in [`evalRunner.ts`](../lib/server/qa/evalRunner.ts)).

Multiset containment means the model may name columns differently, reorder, or add columns — it
just must not miss or change an answer value. This rewards semantically-equivalent SQL rather than
one exact phrasing, which is how LLM-to-SQL is fairly judged.

## What CI guarantees (deterministic, no network)

[`evalRunner.test.ts`](../lib/server/qa/evalRunner.test.ts) runs the whole set with a **perfect
model** — one that returns each case's own reference SQL — and asserts it scores 32/32. This proves,
on every push, that:

- every reference query passes the SQL allowlist (US-F2) and executes against the views,
- the dataset is internally consistent against [`evalFixture.ts`](../lib/server/qa/evalFixture.ts), and
- the scorer is not vacuously passing (a deliberately wrong model is caught).

It needs no API key and no network, so it is safe and fast in CI.

## Measuring the real model

[`evalLive.test.ts`](../lib/server/qa/evalLive.test.ts) runs the set against **real Gemini**. It is
skipped by default and in CI; run it manually with fresh API quota:

```bash
npm run eval          # sets EVAL_LIVE=1 and runs the live suite
```

Rate-limit / quota failures are classified as **infrastructure** (not model errors) and excluded
from the accuracy denominator, so the number reflects model quality, not free-tier limits. The run
fails if fewer than 10 questions could be answered (so quota exhaustion can't masquerade as a pass).
Calls are throttled ~1.2 s apart to stay under the free-tier per-minute cap.

## Measured result

Representative run (2026-06-25, gemini-2.5-flash): **15 / 16 answered correctly = 94%**, against a
**70% acceptance target**. The remaining 16 questions were skipped after the shared free-tier daily
quota across all 7 keys was exhausted mid-run.

The single genuine miss was `biggest-expense-amt` ("largest single expense"): the model returned the
signed amount (`-30000`) where the reference uses the magnitude (`30000`) — a sign-convention
disagreement rather than a wrong figure. Everything else (totals, per-category/month spend, counts,
rankings) matched exactly.

**Caveat:** exact accuracy varies run-to-run with free-tier quota. Re-run `npm run eval` with fresh
quota to reproduce; set `EVAL_OUT=<path>` to also write a per-question PASS/FAIL/SKIP report.
