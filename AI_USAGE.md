# AI Assistance Disclosure

Per Quantic's academic-integrity policy and SRS §12.4, this documents the use of AI tools during
development.

## How AI was used

AI coding assistants were used to support development, including:

- Drafting planning artifacts (the execution roadmap and per-sprint implementation plans aligned
  to the SRS).
- Generating project scaffolding and boilerplate (Next.js setup, configuration, schema).
- Pair-programming feature implementation under developer review.
- Suggesting test cases.
- Code review — adversarial multi-perspective reviews of security- and data-integrity-sensitive
  code (e.g. the foundation, and the category-merge logic, which surfaced a silent data-loss path
  that was then fixed and covered by tests).

> The product's own AI features (Gemini-powered categorization, insights, and natural-language
> Q&A) are application functionality, separate from this development-tooling disclosure.

## Ownership and responsibility

The developer (Khaled Galal) is responsible for the correctness, security, and design of all code
merged to `main`, and understands the code in this repository. AI-generated suggestions were
reviewed, adapted where needed, and verified (lint, type checks, automated tests, and review)
before being committed.

## Third-party code

Any external code or substantial references reused from third parties are cited in
[`CITATIONS.md`](./CITATIONS.md).
