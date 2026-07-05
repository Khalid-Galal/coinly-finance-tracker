# Definition of Done

A user story is **Done** when:

- [ ] Code is on `main` via trunk-based solo development: every push to `main` passes the full CI
      gate (`.github/workflows/ci.yml`) — ESLint, Prettier check, `tsc` typecheck, Vitest with the
      ≥70% coverage thresholds (lines/functions/statements/branches, `vitest.config.ts`),
      `npm audit --omit=dev --audit-level=high`, production build, and the Playwright e2e suite.
      Multi-commit test campaigns were staged on integration branches (`tests/group-a`,
      `tests/group-b`, `tests/group-c`) and merged to `main` after their suites passed
- [ ] Unit + integration tests written and passing in CI
- [ ] Lint, format, and type checks pass
- [ ] Acceptance criteria (from the Trello card / SRS) demonstrably met
- [ ] Relevant documentation updated (DESIGN.md / TESTING.md / README as applicable)
- [ ] If user-facing: deployed to the live instance + a manual UX smoke test performed
- [ ] Status flipped to ☑ on `TASK_BOARD.md` **and** the Trello board
