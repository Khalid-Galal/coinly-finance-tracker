# Sprint 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a deployed Next.js walking skeleton with green CI/CD, Prisma persistence, and the passcode gate — so every later sprint ships to a live URL.

**Architecture:** Next.js 14 App Router full-stack (no separate Express). Layered modules in `lib/server/`. SQLite local / Turso deployed via Prisma. CI/CD on GitHub Actions; deploy to Render.

**Tech Stack:** TypeScript 5, Next.js 14 (App Router), Prisma, SQLite + Turso (libSQL), Vitest, Playwright, ESLint, Prettier, GitHub Actions, Render.

## Global Constraints

- Node 20+; TypeScript strict mode on.
- No secrets in source — env vars only; `.env.example` committed, `.env` git-ignored.
- Every change to `main` via PR (even solo) to exercise CI; squash-merge, linear history.
- Coverage gate ≥70% line (enforced in CI from the first test).
- LICENSE = MIT. Repo shared with GitHub user `quantic-grader`.
- All amounts stored in minor units (integers) — no floats for money.

---

### Task 1: Initialize repo, Next.js scaffold, tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `.gitignore`, `.eslintrc.json`, `.prettierrc`, `.env.example`, `LICENSE`, `app/layout.tsx`, `app/page.tsx`
- Create: `README.md` (skeleton)

**Interfaces:**
- Produces: a runnable `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run build`.

- [ ] **Step 1: Scaffold Next + TypeScript**

```bash
npx create-next-app@14 . --ts --app --eslint --no-tailwind --no-src-dir --import-alias "@/*"
npm pkg set scripts.typecheck="tsc --noEmit"
npm pkg set scripts.format="prettier --check ."
npm i -D prettier
```

- [ ] **Step 2: Turn on strict TS + path alias**

In `tsconfig.json` ensure `"strict": true` and `"paths": { "@/*": ["./*"] }`.

- [ ] **Step 3: Add `.env.example` and LICENSE**

```dotenv
# .env.example
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY=""
APP_PASSCODE=""
EXCHANGE_RATE_BASE_URL="https://open.er-api.com/v6"
LLM_MONTHLY_CAP_USD="5"
```
Add an MIT `LICENSE` with your name.

- [ ] **Step 4: Verify the app builds and lints**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: all three exit 0.

- [ ] **Step 5: Commit**

```bash
git init && git add -A
git commit -m "chore: scaffold Next.js 14 app with strict TS, lint, format"
```

---

### Task 2: Prisma + SQLite + initial schema (US-A1)

**Files:**
- Create: `prisma/schema.prisma`, `lib/server/db.ts`, `lib/server/repositories/accountRepository.ts`
- Test: `lib/server/repositories/accountRepository.test.ts`

**Interfaces:**
- Produces: `prisma` client singleton `db`; `accountRepository.create(input)`, `.list()`, `.get(id)`.
- `AccountInput = { name: string; type: string; currency: string; openingBalanceMinor: number }`

- [ ] **Step 1: Define the full schema** (all SRS entities, so later sprints only add fields)

```prisma
// prisma/schema.prisma
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model Account {
  id              String   @id @default(cuid())
  name            String
  type            String
  currency        String
  openingBalanceMinor Int   @default(0)
  archivedAt      DateTime?
  transactions    Transaction[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Category {
  id         String     @id @default(cuid())
  parentId   String?
  parent     Category?  @relation("CatTree", fields: [parentId], references: [id])
  children   Category[] @relation("CatTree")
  name       String
  color      String?
  icon       String?
  archivedAt DateTime?
  transactions Transaction[]
  rules      CategorizationRule[]
  budgets    Budget[]
}

model Transaction {
  id           String   @id @default(cuid())
  accountId    String
  account      Account  @relation(fields: [accountId], references: [id])
  date         DateTime
  amountMinor  Int
  currency     String
  description  String
  payee        String?
  categoryId   String?
  category     Category? @relation(fields: [categoryId], references: [id])
  aiConfidence Float?
  source       String   // "csv" | "manual" | "voice"
  rawCsvRow    String?
  dedupeHash   String   @unique
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([date])
  @@index([categoryId])
}

model CategorizationRule {
  id         String  @id @default(cuid())
  matchType  String  // "merchant_exact" | "contains"
  pattern    String
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])
  createdFromCorrection Boolean @default(true)
}

model Budget {
  id          String @id @default(cuid())
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  month       String  // "YYYY-MM"
  amountMinor Int
  currency    String
  @@unique([categoryId, month])
}

model ExchangeRate {
  id    String   @id @default(cuid())
  date  DateTime
  base  String
  quote String
  rate  Float
  @@unique([date, base, quote])
}

model Insight {
  id          String   @id @default(cuid())
  periodStart DateTime
  periodEnd   DateTime
  type        String   // "weekly" | "monthly"
  content     String
  model       String?
  generatedAt DateTime @default(now())
}

model QaHistory {
  id           String   @id @default(cuid())
  askedAt      DateTime @default(now())
  question     String
  generatedSql String?
  resultJson   String?
  wasUseful    Boolean?
}

model AuditLog {
  id        String   @id @default(cuid())
  entity    String
  entityId  String
  action    String
  beforeJson String?
  afterJson  String?
  timestamp DateTime @default(now())
}

model Setting {
  key   String @id
  value String
}
```

- [ ] **Step 2: Generate client + first migration**

```bash
npm i prisma @prisma/client && npm i -D vitest
npx prisma migrate dev --name init
```

- [ ] **Step 3: db singleton**

```typescript
// lib/server/db.ts
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;
```

- [ ] **Step 4: Write the failing repository test**

```typescript
// lib/server/repositories/accountRepository.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db";
import { accountRepository } from "./accountRepository";

beforeEach(async () => { await db.account.deleteMany(); });

describe("accountRepository", () => {
  it("creates and lists an account", async () => {
    await accountRepository.create({ name: "CIB Checking", type: "bank", currency: "EGP", openingBalanceMinor: 0 });
    const all = await accountRepository.list();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("CIB Checking");
  });
});
```

- [ ] **Step 5: Run it, verify it fails**

Run: `npx vitest run accountRepository`
Expected: FAIL — `accountRepository` not found.

- [ ] **Step 6: Implement the repository**

```typescript
// lib/server/repositories/accountRepository.ts
import { db } from "../db";
export type AccountInput = { name: string; type: string; currency: string; openingBalanceMinor: number };
export const accountRepository = {
  create: (input: AccountInput) => db.account.create({ data: input }),
  list: () => db.account.findMany({ where: { archivedAt: null }, orderBy: { createdAt: "asc" } }),
  get: (id: string) => db.account.findUnique({ where: { id } }),
};
```

- [ ] **Step 7: Run it, verify it passes**

Run: `npx vitest run accountRepository`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add prisma lib/server
git commit -m "feat: prisma schema + account repository (US-A1)"
```

---

### Task 3: Health route, passcode middleware, skeleton page

**Files:**
- Create: `app/api/health/route.ts`, `middleware.ts`, `lib/server/passcode.ts`
- Test: `lib/server/passcode.test.ts`, `e2e/health.spec.ts`

**Interfaces:**
- Produces: `GET /api/health` → `{ ok: true }`; `isAuthorized(req): boolean`.

- [ ] **Step 1: Failing test for passcode check**

```typescript
// lib/server/passcode.test.ts
import { describe, it, expect } from "vitest";
import { checkPasscode } from "./passcode";
describe("checkPasscode", () => {
  it("passes when header matches env", () => { expect(checkPasscode("s3cret", "s3cret")).toBe(true); });
  it("fails when header missing or wrong", () => {
    expect(checkPasscode(null, "s3cret")).toBe(false);
    expect(checkPasscode("nope", "s3cret")).toBe(false);
  });
  it("passes everything when no passcode configured (local)", () => { expect(checkPasscode(null, "")).toBe(true); });
});
```

- [ ] **Step 2: Run, verify fail.** Run: `npx vitest run passcode` → FAIL.

- [ ] **Step 3: Implement passcode + middleware**

```typescript
// lib/server/passcode.ts
export function checkPasscode(provided: string | null, configured: string): boolean {
  if (!configured) return true;            // local/no-gate
  return provided === configured;
}
```
```typescript
// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { checkPasscode } from "@/lib/server/passcode";
export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api")) return NextResponse.next();
  const ok = checkPasscode(req.headers.get("x-passcode"), process.env.APP_PASSCODE ?? "");
  return ok ? NextResponse.next() : new NextResponse("Unauthorized", { status: 401 });
}
export const config = { matcher: "/api/:path*" };
```
```typescript
// app/api/health/route.ts
export async function GET() { return Response.json({ ok: true }); }
```

- [ ] **Step 4: Run, verify pass.** Run: `npx vitest run passcode` → PASS.

- [ ] **Step 5: Playwright skeleton E2E**

```typescript
// e2e/health.spec.ts
import { test, expect } from "@playwright/test";
test("health endpoint responds ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toEqual({ ok: true });
});
```
Install + config: `npm i -D @playwright/test && npx playwright install --with-deps chromium`. Add `playwright.config.ts` with `webServer: { command: "npm run build && npm start", port: 3000 }`.

- [ ] **Step 6: Commit**

```bash
git add app middleware.ts lib/server e2e playwright.config.ts
git commit -m "feat: health route + passcode middleware + e2e skeleton"
```

---

### Task 4: CI pipeline (US-G4)

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `package.json` (add `test:coverage` script + coverage threshold)

- [ ] **Step 1: Coverage script + threshold**

```bash
npm i -D @vitest/coverage-v8
npm pkg set scripts.test="vitest run"
npm pkg set scripts.test:coverage="vitest run --coverage"
```
In `vitest.config.ts` set `test.coverage = { provider: "v8", thresholds: { lines: 70 }, reporter: ["text","json","html"] }`.

- [ ] **Step 2: CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI
on: { push: { branches: [main] }, pull_request: {} }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run format
      - run: npm run typecheck
      - run: npx prisma migrate deploy
        env: { DATABASE_URL: "file:./ci.db" }
      - run: npm run test:coverage
        env: { DATABASE_URL: "file:./ci.db" }
      - run: npm audit --audit-level=high
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        with: { name: coverage, path: coverage/ }
```

- [ ] **Step 3: Verify locally (act-style dry run)**

Run each line locally: `npm run lint && npm run typecheck && npm run test:coverage && npm run build`.
Expected: all exit 0; coverage ≥70%.

- [ ] **Step 4: Commit + open first PR to confirm CI is green**

```bash
git checkout -b feature/sprint0-ci
git add .github vitest.config.ts package.json
git commit -m "ci: lint, types, tests+coverage(70%), audit, build, e2e"
git push -u origin feature/sprint0-ci   # open PR, watch CI go green, squash-merge
```

---

### Task 5: Deploy skeleton to Render + Turso (US-G5)

**Files:**
- Create: `render.yaml`, `.github/workflows/deploy.yml`
- Modify: `lib/server/db.ts` (libSQL adapter when `TURSO_*` present)

**Interfaces:**
- Produces: live URL serving `/api/health` over HTTPS; auto-deploy on merge to `main`.

- [ ] **Step 1: libSQL adapter for deployed DB**

```bash
npm i @libsql/client @prisma/adapter-libsql
```
```typescript
// lib/server/db.ts  (replace singleton)
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
function make() {
  if (process.env.TURSO_DATABASE_URL) {
    const libsql = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
    return new PrismaClient({ adapter: new PrismaLibSQL(libsql) });
  }
  return new PrismaClient();
}
export const db = g.prisma ?? make();
if (process.env.NODE_ENV !== "production") g.prisma = db;
```
Enable `previewFeatures = ["driverAdapters"]` in the Prisma generator.

- [ ] **Step 2: render.yaml**

```yaml
services:
  - type: web
    name: coinly
    env: node
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - { key: TURSO_DATABASE_URL, sync: false }
      - { key: TURSO_AUTH_TOKEN, sync: false }
      - { key: GEMINI_API_KEY, sync: false }
      - { key: APP_PASSCODE, sync: false }
```

- [ ] **Step 3: Provision Turso + push schema**

```bash
turso db create coinly && turso db tokens create coinly
npx prisma migrate deploy   # against Turso URL
```

- [ ] **Step 4: CD workflow with smoke test + rollback note**

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: { push: { branches: [main] } }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fSs -X POST "$RENDER_DEPLOY_HOOK"
        env: { RENDER_DEPLOY_HOOK: ${{ secrets.RENDER_DEPLOY_HOOK }} }
      - run: sleep 90 && curl -fSs "$DEPLOY_URL/api/health" | grep '"ok":true'
        env: { DEPLOY_URL: ${{ secrets.DEPLOY_URL }} }
```
(Render keeps the prior deploy live if the new one fails health — document this as the rollback path in DESIGN.md.)

- [ ] **Step 5: Verify the live URL**

Open `https://<your-app>.onrender.com/api/health` in an incognito window → `{"ok":true}`.

- [ ] **Step 6: Commit**

```bash
git add render.yaml .github/workflows/deploy.yml lib/server/db.ts prisma/schema.prisma
git commit -m "feat: Turso adapter + Render deploy + smoke test (US-G5)"
```

---

### Task 6: Project governance docs + Trello

**Files:**
- Create: `DESIGN.md` (starter), `TESTING.md` (starter), `AI_USAGE.md`, `CITATIONS.md`, `docs/definition-of-done.md`, `docs/product-owner-persona.md`
- Modify: `README.md` (links to deployed app, Trello board, design/testing docs)

- [ ] **Step 1: Create the docs** with section headers from SRS §11.1 / §5; DESIGN.md starts with the Next-only architecture decision + the 7 patterns (one paragraph each, filled as you build).
- [ ] **Step 2: Trello** — create board with columns Product Backlog / Sprint Backlog / In Progress (WIP 2) / In Review / Blocked / Done / Archive; load all US-XX cards from SRS §7.3; link board in README.
- [ ] **Step 3: Share repo** with `quantic-grader`; put deployed URL + passcode + Trello link in README.
- [ ] **Step 4: Commit**

```bash
git add README.md DESIGN.md TESTING.md AI_USAGE.md CITATIONS.md docs/
git commit -m "docs: governance docs, DoD, PO persona, README links"
```

---

## Sprint 0 Demo (record for sprint review)
Show: repo on GitHub shared with grader → green CI on a PR → live `/api/health` over HTTPS → Trello board with full backlog.

## Sprint 0 Definition of Done
- [ ] Live URL serves `/api/health` over HTTPS
- [ ] CI green on `main`: lint, format, types, tests+coverage(≥70%), audit, build, e2e
- [ ] Auto-deploy on merge verified by smoke test
- [ ] Prisma schema migrated locally + on Turso
- [ ] Trello board live with all stories; repo shared with `quantic-grader`
