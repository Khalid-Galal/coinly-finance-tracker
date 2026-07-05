# Coinly — Test Plan

> Companion to [`TESTING.md`](./TESTING.md) (strategy) and [`UI_POLISH.md`](./UI_POLISH.md) (visual QA).
> This document is the **inventory + acceptance plan**: every page, endpoint, component, flow, and
> server module, with what "working" means and the happy-path + edge cases to verify. The codebase
> ships **359 Vitest test cases (358 passed + 1 intentionally skipped, 68 files) at 96.4%
> statements / 97.5% lines / 91.0% branches over the CI-gated `lib/**` scope (threshold 70%)** —
> including in-process API route-handler tests — **plus 5 Playwright specs (~26 tests)**; this
> plan documents the full behavioral contract, calls out the **gaps** those tests miss, and
> partitioned the remaining work into 3 independently-runnable groups (§8).
>
> **Status (2026-07-04):** All three groups (A/B/C) have been executed and merged to `main`. Most of
> the ⚠ flags below are now **resolved** — notably: malformed-JSON → 400 (accounts/transactions/
> budgets/insights), FK violations → 400/404 (not 500), the import schema leak, the `canParse`
> quoted-header bug, duplicate `applyCorrection` rules, the `convertMinor` NaN/zero FX hole, the
> `//evil.com` open redirect, and the "no test file" gaps for `passcode`/`voice`/`schemas`/
> `exchangeRateRepository`. New since this plan was written: unlock **rate limiting**, a production
> **/welcome re-run guard**, surfaced fetch/POST errors on the client pages, a demo **seed script**,
> and committed sample CSVs. The §8.2 per-group isolation scheme was **superseded** by a single
> shared e2e runtime (see §8.2). Treat the inline ⚠ markers below as the *original* findings, not the
> current state.

## 0. How to use this plan

- **Existing coverage** is noted per item (`✅ tested` / `⚠ gap`). "Gap" = behavior the current suite does not assert; these are the highest-value tests to add.
- **Layers:** pages/components have *no* unit tests (only e2e) — drive them with Playwright. Endpoints are thin handlers — test via HTTP integration. Domain logic lives in `lib/**` and is unit-tested.
- **Gate:** every `/api/*` call below assumes the passcode cookie is set; an unauthenticated call returns **401** (page navigations redirect to `/unlock`). `/api/health`, `/api/unlock`, `/unlock` are public. This is enforced by `proxy.ts` *before* any handler runs — assert it once (§6), don't repeat per endpoint.

## 1. Inventory at a glance

| Kind | Count | Items |
| --- | --- | --- |
| Pages / routes | 13 | `/` · `/welcome` · `/unlock` · `/dashboard` · `/transactions` · `/quick-add` · `/accounts` · `/import` · `/budgets` · `/insights` · `/categories` · `/ask` · `/settings` |
| API route files | 15 (22 method-endpoints) | accounts · transactions(+[id]) · import · categorize · budgets(+[id]) · categories(+[id]+[id]/merge) · insights · qa · settings · unlock · health |
| Client components | 3 | `SiteNav` · `TransactionsTable` · `AskClient` |
| Server/domain modules | ~40 under `lib/server/**` + `lib/shared/**` | import · categorize · analytics · budgets · insights · qa · categories · settings · money · infra · repositories · passcode · schemas · voice |
| Shared/cross-cutting | — | `db.ts` · `errors.ts` · `schemas.ts` · `infra/gemini*` · `layout.tsx` · `SiteNav` · `globals.css` · `proxy.ts` · `passcode.ts` (see §6 & §8) |

Group tags **[A]/[B]/[C]** map to the parallelization plan in §8.

---

## 2. Pages & user flows

### `/` — Home **[C]** · `app/page.tsx` (RSC, `force-dynamic`)
**Working:** On first run (`db.account.count() === 0`) renders a `👋 Welcome!` card with `Start setup →` → `/welcome`. Always renders links to `/import`, `/quick-add`, `/accounts`, `/api/health`.
- **Happy:** fresh DB → welcome card visible, link routes to `/welcome`; DB with ≥1 account → card absent, three nav links present.
- **Edge:** unauthenticated → redirect `/unlock?next=%2F`; production with `APP_PASSCODE` unset → 503 before render; DB unreachable → default Next error page (no custom boundary).

### `/welcome` — First-run wizard **[C]** · `app/welcome/page.tsx`
**Working:** 3 steps — (1) `PUT /api/settings` base currency, (2) `POST /api/accounts` first account, (3) "✓ You're all set!" with links to `/import`, `/quick-add`, `/dashboard`. Step indicator marks done steps with `✓`.
- **Happy:** mount fetches `/api/settings` (prefills `EGP`); enter `USD` → Continue → step 2; name `CIB Current` + type `bank` → Create → step 3 with green success + 3 links.
- **Edge:** 1–2-letter code → Continue disabled (`length !== 3`) + msg "Enter a 3-letter currency code."; PUT/POST non-2xx → red `Error:` msg, stays on step; empty name → "Enter an account name."; **no back button**; refresh resets to step 1; **no server guard** — reachable after setup, re-running overwrites currency & creates duplicate account (⚠ flag).
- **Gap:** mount `GET /api/settings` has no `.catch()` → silent failure leaves default with no feedback.

### `/unlock` — Passcode gate **[C]** · `app/unlock/page.tsx` (public)
**Working:** password input (`aria-label="Passcode"`, autofocus); Unlock disabled when `busy || !passcode`; `POST /api/unlock` → on 200 redirect to `?next` (if it starts with `/`) else `/`; wrong code → "Incorrect passcode."
- **Happy:** correct code → cookie set → navigate `/`; `?next=%2Fdashboard` → `/dashboard`; `next=http://evil.com` (no leading `/`) → falls back to `/`.
- **Edge:** wrong code → 401 → message, input retained; empty → button disabled; **`next=//evil.com` → open redirect** (`"//evil.com".startsWith("/")` is true) ⚠ security; network error on fetch → no message (only button re-enables) ⚠; no rate limiting → unbounded brute force ⚠.

### `/dashboard` — Overview **[B]** · `app/dashboard/page.tsx` (RSC, `force-dynamic`)
**Working:** 3 stat cards (Income/Expenses/Net) labelled in base currency; 4 range pills (`this-month`/`last-month`/`last-3-months`/`ytd`); category breakdown table sorted desc (or "No expenses in this range."); fixed 6-month income-vs-expense bar chart.
- **Happy:** no `?range` → `this-month` active, current-month figures, currency label everywhere; each range pill switches stats; category table desc, uncategorized → "Uncategorized"; trend always exactly 6 bars incl. zero-height months; bar `title` = `Income 1000.00`; footer "{n} transactions in range".
- **Edge:** `?range=invalid` → silently falls back to this-month (no crash); zero txns → all `0.00`, empty-state text; all-income → empty `byCategory`; `amountMinor===0` → counted as income, absent from breakdown (⚠ document); negative net → no colour cue (legible check); year-boundary `lastNMonths` (e.g. Feb) → labels like `25-09`; DB failure → 500, no boundary.
- **⚠ Risks:** trend is **always last-6-months regardless of selected pill** (not labelled — confusing); **no multi-currency conversion** (sums mixed currencies — meaningless totals); `ytd` upper bound is end-of-current-month, not today.

### `/transactions` — List **[A]** · `app/transactions/page.tsx` (RSC, `force-dynamic`)
**Working:** loads all transactions + categories in parallel; empty → "No transactions yet."; else `<TransactionsTable>`. Calls `seedDefaultTaxonomy()` on **every** render. Links to `/import`, `/quick-add`, `/accounts`.
- **Happy:** rows carry `{id,date(YYYY-MM-DD),description,categoryId,categoryName,amountMinor,currency,source}`; date via `.toISOString().slice(0,10)` (verify TZ); seed is idempotent.
- **Edge:** empty list → message, table not mounted; **no pagination/limit** — 10k rows all loaded (perf ⚠); DB failure at render → unhandled 500.

### `/quick-add` — Manual entry **[A]** · `app/quick-add/page.tsx`
**Working:** mount fetches `/api/accounts`, preselects `accounts[0]`; valid submit → `POST /api/transactions` with `{accountId,date,amountMinor,currency,description,source:"manual"}`, resets form, shows "Added."; no accounts → form hidden, "No accounts yet." + link.
- **Happy:** all 5 controls render; `150.75` → `amountMinor:15075` (`Math.round(x*100)`, `0.005→1`); switching account changes `accountId`+`currency`.
- **Edge:** 0 accounts → empty-state branch; server 400 → `Error: <json>`; empty amount blocked by `required`; programmatic NaN amount → serialized `null` → server 400; negative amount → 201 (valid); `GET /api/accounts` **401 → JSON object cast to array → `.map` crash** ⚠; network error on accounts fetch → stuck empty-state (no `.catch`).

### `/accounts` — Accounts **[A]** · `app/accounts/page.tsx`
**Working:** mount fetches `/api/accounts` → `<ul>` of `{name} ({type}, {currency})`; create form → `POST /api/accounts` → "Account created.", reload, reset.
- **Happy:** form fields name(required)/type(default `bank`)/currency(`maxLength=3`, default `EGP`); create `CIB Savings/bank/EGP` → row appears; currency upper-cased before save.
- **Edge:** currency `EG` (2 chars) submittable (no min) → server 400; empty type → client defaults `bank`; **no archive/delete UI** (archive excluded from list, but unreachable); `openingBalanceMinor` not settable from UI (always 0); double-submit → two same-name accounts (no uniqueness) ⚠; 401 → same array-cast crash as quick-add ⚠.

### `/budgets` — Budgets **[B]** · `app/budgets/page.tsx`
**Working:** month picker defaults to current month (`YYYY-MM`); category `<select>` from `/api/categories`; currency from `/api/settings`; submit → `POST /api/budgets` (upsert) → "Budget saved." + progress refresh; each row = name, `spent/budget cur (pct%)`, bar, status label, Remove.
- **Happy:** set `50.00` → POST `{categoryId,month,amountMinor:5000,currency}` → row `0.00 / 50.00 EGP (0%)` green "On track"; spend 80% → amber "Approaching limit"; over → red "Over budget by X.XX"; Remove → `DELETE /api/budgets/{id}` + refresh; change month → reloads; re-set same (cat,month) → updates not duplicates; list sorted by pct desc.
- **Edge:** no category → "Pick a category and a positive amount." (no call); amount `0` or negative → same client guard (note `min="0"` doesn't block 0); `/api/categories` fail → only disabled placeholder, no error; `/api/budgets` returns non-array (500) → shows "No budgets…yet." (misleading) ⚠; Remove ignores response status ⚠; success & error msgs share `#555` grey (indistinguishable) ⚠.

### `/insights` — AI insights **[B]** · `app/insights/page.tsx`
**Working:** mount `GET /api/insights` → `{insights, usage, anomalies}`; usage line "AI usage today: used / cap" (red at 0 remaining + fallback note); anomaly box (only if `>0`) "⚠ Spending alerts (this month)"; cards "{type} · start → end · AI({model})" or "offline report"; two generate buttons.
- **Happy:** existing data renders all 3 sections; click weekly → button "Generating…", both disabled, POST `{type:"weekly"}`, refresh; monthly same; model null → "offline report".
- **Edge:** initial null data → only "No insights yet."; **fetch failure → silent** (data stays null, no error) ⚠; POST 500 → silent (no status check) ⚠; long content → unbounded card growth; >10 insights → server caps 10.

### `/categories` — Manage **[B]** · `app/categories/page.tsx`
**Working:** `GET /api/categories` → inline-edit row per active category (name input `aria-label="Rename <name>"` + Save + Archive); "Merge categories" form (two selects); `role="status"` live region echoes results.
- **Happy:** add new → `POST /api/categories {name}` → "Category created."; edit + Save → `PATCH /api/categories/<id>` → "Renamed."; Archive → `window.confirm` → `DELETE` → "Archived."; Merge two → `POST /api/categories/<from>/merge {intoId}` → source gone, "Merged."; "Merge into" excludes selected "Merge from".
- **Edge:** Add disabled on blank/whitespace; Save disabled when unchanged; cleared name → "Error: name cannot be empty" (no call); confirm dismissed → no call; dup name → "Error: a category with that name already exists"; 500 non-JSON → "Error: <statusText>"; `busy` disables all buttons (no double-submit); **flat list — no parent/child hierarchy shown**; **`load()` errors silently swallowed** (no `.catch`) ⚠; `msg` never auto-cleared ⚠; **UI never sends `parentId`** (can't create child).

### `/ask` — Natural-language Q&A **[C]** · `app/ask/page.tsx` + `AskClient.tsx`
**Working:** `<h1>Ask Coinly</h1>`, description, question input (`aria-label="Question"`, placeholder example), voice mic button, 3 example chips, answer area with "Show generated SQL" `<details>`.
- **Happy:** type question + Ask → `POST /api/qa` once → answer string + SQL disclosure; example chip → fills input + fires request; 0 rows → answer only, no table.
- **Edge:** empty/space input → `ask()` short-circuits (silent, no feedback); submit while `busy` → button disabled, guard drops dupes; **example chips NOT disabled during busy** → input changes but no request fires (confusing) ⚠; network error → red `⚠` paragraph; API `{error}` body with 400/500 → client reads `data.error` (status never checked); voice unsupported → "Voice input isn't supported…"; mic permission denied → `onerror` only resets listening, **no user message** ⚠; TTS reads back `data.answer` (e.g. "3 results.") — unhelpful for multi-row ⚠.

### `/settings` — Base currency **[C]** · `app/settings/page.tsx`
**Working:** mount `GET /api/settings` prefills `<input>` + `<strong>`; edit valid 3-letter code → `PUT /api/settings` → updates display + "Base currency saved." (`role="status"`).
- **Happy:** prefill stored currency; `usd` auto-uppercases to `USD`; Save disabled when `draft===saved` or `length!==3`; save `USD` → updates; busy disables save.
- **Edge:** GET fail (network/401) → blank, no error (silent) ⚠; invalid code via DevTools → 400 error msg; `XYZ` accepted (no ISO-4217 list) → downstream FX no-ops ⚠; double-click guarded.

---

## 3. API endpoints

> Format: **contract** → happy → edge. All non-public routes are 401 when unauthenticated (§6).

### Accounts **[A]** · `app/api/accounts/route.ts`
- **`GET /api/accounts`** → 200 array of non-archived accounts, `createdAt` asc. Happy: `[]` when none; archived excluded; order. Edge: DB error → unhandled 500.
- **`POST /api/accounts`** → body `{name, type?=bank, currency?=EGP(len3), openingBalanceMinor?=0(int)}`; 201 record / 400 `{error: issues[]}`. Happy: minimal `{name}` applies defaults; full payload. Edge: `{}`→400 (name); `name:""`→400; `currency:"US"|"USDT"`→400; `openingBalanceMinor:1.5`→400; `type:""`→400; **malformed JSON → unhandled 500** ⚠; duplicate name → both 201 (no uniqueness).

### Transactions **[A]** · `app/api/transactions/route.ts` + `[id]/route.ts`
- **`GET /api/transactions`** (`?accountId`) → 200, date desc, includes `category.name`. Edge: unknown accountId → `[]`; none → `[]`.
- **`POST /api/transactions`** → `transactionInputSchema`; 201 / 400 `{error: flatten()}`. Happy: minimal valid; `amountMinor:-5000`/`0` → 201; `source` defaults `manual`; null payee/categoryId ok. Edge: `date:"2025-13-01"`→400 (refine), `"2025-6-1"`→400 (regex); float amount→400; `null` amount→400; `currency:"EG"`→400; `source:"import"`→400; **non-existent accountId → Prisma FK → unhandled 500** ⚠; malformed JSON → 500 ⚠; duplicate row → both 201 (dedupeHash stored, not constrained on this path).
- **`PATCH /api/transactions/[id]`** → `{categoryId(min1)}`; updates category, writes audit log, calls `applyCorrection`; 200 `{ok:true}` / 400 / 404. Happy: valid → updated + correction rule created. Edge: `{categoryId:""}`/`{}`→400; unknown id→404 `{error:"not found"}`; **non-existent categoryId → FK → 500** ⚠; **`applyCorrection` throws after DB update → 500 but txn already changed (inconsistent)** ⚠; **no DELETE route** (`remove()` unreachable).

### Import **[A]** · `app/api/import/route.ts`
- **`POST /api/import`** → `multipart/form-data` `{file:File, accountId}`; 200 `{imported, skipped}` / 400 `{error}`. Happy: generic CSV → counts; re-POST same → `{imported:0, skipped:N}`; BOM CSV; debit/credit CSV (CIB). Edge: missing file/accountId → 400 "file and accountId are required"; unknown header → 400 "Unsupported CSV format"; empty file → 400 "Unsupported CSV format" (no header line, so no parser matches — a header-only file with no data rows is what yields `{0,0}`); **bad accountId → raw Prisma FK error in 400 (leaks schema)** ⚠; **no size/row limit** (OOM risk) ⚠; within-file dup rows → deduped.

### Categorize **[A]** · `app/api/categorize/route.ts`
- **`POST /api/categorize`** (no body) → 200 `{categorized, total}` / 500 `{error}`. Happy: all rule-matched → `categorized===total`, LLM never called; none pending → `{0,0}`. Edge: DB down → 500; **LLM quota exhausted → still 200** (per-chunk catch; only rule matches count) — assert *no false 500*; 201+ pending → only 200 processed (`MAX_PER_RUN` cap), 201st untouched; extraneous body ignored.

### Budgets **[B]** · `app/api/budgets/route.ts` + `[id]/route.ts`
- **`GET /api/budgets?month=YYYY-MM`** → 200 `BudgetProgress[]` (pct desc) / 400 / 500. Happy: existing budgets; future month → `[]`. Edge: missing month → 400; `2026-13`/`2026-00`/`2026-1`/`abcd-01` → 400 (`MONTH_RE`); category with spend but no budget → absent.
- **`POST /api/budgets`** → `budgetInputSchema {categoryId,month,amountMinor>0 int,currency len3}`; 200 upsert / 400 / 500. Happy: create; re-POST same (cat,month) → update, one row. Edge: amount `0`/negative/float/string → 400; `categoryId:""`→400; bad month → 400; currency len≠3 → 400; **bad categoryId → FK → 500 (no 404)** ⚠; **malformed JSON → unhandled 500** (no try/catch around `req.json()`) ⚠.
- **`DELETE /api/budgets/[id]`** → 200 `{ok:true}` / 500. Happy: valid id → gone. Edge: **unknown id → Prisma P2025 → 500 (not 404)** ⚠; double-delete → 200 then 500.

### Categories **[B]** · `route.ts` + `[id]/route.ts` + `[id]/merge/route.ts`
- **`GET /api/categories`** → calls `seedDefaultTaxonomy()` (idempotent) then 200 array (name asc). Happy: fresh DB → 27 seeded (9 parents + 18 children); existing → no-op. Edge: all archived → re-seeds; seed COUNT runs every request (latency note).
- **`POST /api/categories`** → `{name, parentId?}`; 200 record / 400. Happy: `{name}`; trims `"  Groceries  "`; valid child via `parentId`. Edge: `{}`/`{name:""}`→400 "name is required"; 101 chars→400; case-insensitive dup→400 "already exists"; unknown/archived parent→400 "parent category not found"; parent-is-child→400 "two levels deep"; bad JSON→400 "invalid JSON body"; **non-UUID `parentId` → Prisma error → 500 not 400** ⚠.
- **`PATCH /api/categories/[id]`** → `{name}`; 200 / 400 / 404. Happy: rename; trims. Edge: empty/dup/long → 400; unknown id → 404; **renaming archived id silently succeeds (no guard)** ⚠.
- **`DELETE /api/categories/[id]`** → soft-archive, returns updated record. Happy: leaf → `archivedAt` set, gone from GET. Edge: parent w/ live children → 400 "move or archive sub-categories first"; unknown → 404; already-archived → re-archives (no guard).
- **`POST /api/categories/[id]/merge`** → `{intoId}`; repoints txns+rules+budgets, resolves budget-month conflicts (target wins), archives source; all in `$transaction`; 200 `{ok:true}` / 400 / 500. Happy: merge w/ txns+rule+budget; same-month budget conflict → source dropped; empty source. Edge: missing/empty intoId→400; `from===into`→400 "into itself"; source/target not found→400; source/target archived→400; source has children→400; **assert atomic rollback** on mid-transaction failure.

### Insights **[B]** · `app/api/insights/route.ts`
- **`GET /api/insights`** → 200 `{insights[≤10], usage{used,cap,remaining}, anomalies}`. Happy: ordering; none → `[]`; cap boundary → `remaining:0`. Edge: Gemini keys missing / DB down → unhandled 500; month resolved via UTC `monthKeyOf` (clock note).
- **`POST /api/insights`** → `{type:"weekly"|"monthly"}` (manual `===`, no Zod); 200 record / 400 / 500. Happy: weekly & monthly → record w/ `model` (null over cap → deterministic fallback). Edge: `"yearly"`/`{}`→400; **malformed/empty JSON body → unhandled 500** ⚠; Gemini 429/all-keys-fail → 500; **cap-boundary race in `recordLlmCall`** (read-modify-write) → can exceed cap by 1 ⚠.

### Q&A **[C]** · `app/api/qa/route.ts`
- **`POST /api/qa`** → `{question}`; 200 `QaResult{question,sql,rows,answer,error?}` / 400 / 500. **Key:** allowlist rejection & query failure return **200 with `error` in body**, not 4xx (§ note). Happy: valid question → `rows` array + non-null SELECT over `v_transactions`/`v_category_totals`; scalar → `"n: 3"`; 0 rows → "No matching results."; multi-row → "N results."
- **Edge:** missing/whitespace/non-string question → 400 "A question is required."; malformed JSON → 500; markdown-fenced SQL → stripped; **DELETE/INSERT/non-allowlisted table/`--` comment/multi-statement → 200 with `error`** (allowlist); valid SELECT but missing view → 200 `error`; BigInt aggregate → normalized to Number (no serialize crash); history insert failure → swallowed, result still returned. ⚠ uses `$queryRawUnsafe` (allowlist is sole defense); no rate limit (quota-drain risk).

### Settings **[C]** · `app/api/settings/route.ts`
- **`GET /api/settings`** → 200 `{baseCurrency}` (default `EGP`). Edge: DB error → 500.
- **`PUT /api/settings`** → `{baseCurrency}`; normalizes `trim().toUpperCase()`, validates `/^[A-Z]{3}$/`; 200 / 400. Happy: `USD`; `usd`→`USD`; idempotent upsert. Edge: `{}`/`US`/`US1`/`EURO`/`null` → 400; bad JSON → 400 "invalid JSON body"; `XYZ` → 200 (no ISO-4217 check) ⚠.

### Unlock & Health **[C]** · `app/api/unlock/route.ts`, `app/api/health/route.ts` (both public)
- **`POST /api/unlock`** → `{passcode}`; correct → 200 `{ok:true}` + `Set-Cookie coinly_pass` (HttpOnly, SameSite=Lax, Max-Age=86400, `Secure` in prod); wrong/missing/non-string/bad-JSON → **401** (by design, not 400). Edge: `APP_PASSCODE=""` in prod → any passcode unlocks (but proxy 503s everything else); **no rate limit** ⚠; verify `Secure` flag present only in production.
- **`GET /api/health`** → always 200 `{ok:true}`. Edge: **does not check DB** — 200 even if SQLite is down (false-positive for monitoring) ⚠; POST/PUT/DELETE → 405.

---

## 4. Components

### `SiteNav` **[C4/shared]** · `app/_components/SiteNav.tsx`
**Working:** `<nav aria-label="Primary">` brand + 7 links; active link gets `class="active"` via `usePathname`; returns `null` on `/unlock` and `/welcome`.
- Happy: `/dashboard` → only Dashboard active; `/transactions/123` → Transactions active (startsWith); brand → `/`; keyboard-tabbable.
- Edge: `pathname===null` → falls back `/` (no crash); `/unlock` & `/welcome/step2` → no `<nav>` in DOM; no two links active at once (sub-route collision).
- ⚠ Gaps: no `aria-current="page"`; link contrast ~3.8:1 (<AA); no focus-visible ring; no mobile collapse (7 links wrap to 2nd row).

### `TransactionsTable` **[A]** · `app/transactions/TransactionsTable.tsx`
**Working:** table Date/Description/Category(select)/Amount/Source; per-row select `aria-label="Category for <desc>"`; change → `PATCH /api/transactions/{id}` → `busy=id` disables that row → `router.refresh()`; "Auto-categorize" → `POST /api/categorize`.
- Happy: select category → PATCH + refresh; amount `(minor/100).toFixed(2) cur`; categorizeAll msg "Categorizing…"→"Categorized X of Y."
- Edge: **placeholder option `value=""` + `if(!categoryId) return` → cannot de-assign a category** ⚠; **PATCH response not checked** → refreshes even on 400/500, select silently reverts, no feedback ⚠; no pagination (all rows in DOM); no income/expense colour distinction; legacy `border/cellPadding` attrs (not design-system).

### `AskClient` **[C]** · `app/ask/AskClient.tsx`
**Working:** form (input + Ask + voice); example chips; result area (answer, optional table, optional SQL `<details>`). State `question/busy/listening/result`.
- Happy: submit → `POST /api/qa` once, `busy` true (button "Asking…", disabled); columns ending `minor` (case-insensitive) ÷100 + right-aligned; null cell → "—"; voice unsupported → friendly error; voice success → fills input + `ask(text, true)` + TTS read-back; new ask clears prior result first.
- Edge: ⚠ **example chips not disabled during busy** (input updates, no request); ⚠ `rec.onerror` only resets listening (no message); ⚠ column not suffixed `minor` (e.g. `SELECT SUM(amountMinor) AS total`) shows raw int in table but ÷100 in answer string — discrepancy; concurrent voice+typed → voice transcript silently lost via busy guard.

---

## 5. Server / domain modules — contract + gaps to fill

> All have neighbouring `*.test.ts` unless noted. "Gap" = add these tests.

**Import [A]** — `importService` ✅ (full import, re-import dedupe, BOM, unsupported) · gaps: within-file dup rows, bad-accountId FK surface, header-only/all-blank CSV, debit/credit end-to-end. `hash.dedupeHash` ✅ · gap: sensitivity to `date` change. `registry.pickParser` · gap: header satisfying both parsers. `genericParser` ✅ · gaps: missing-currency default EGP, payee mapping, blank amount→0, unparseable date passthrough→Invalid Date. `debitCreditParser` ✅ · gaps: both debit+credit non-empty, bank-negative debit, missing-description hash collisions. `shared` utils · gaps: `toMinor("1.005")` rounding, `toIsoDate` MM/DD/YYYY misparse, `pickField` all-absent. ⚠ `canParse` uses `split(",")` not Papa → quoted-comma headers misparse.

**Categorize [A]** — `matchByRules` ✅ · gaps: payee-only `contains`, first-match-wins tie, `merchant_exact` ignoring payee, empty rules. `llm.*` ✅ · gaps: extra LLM objects ignored, non-array reply→all Uncategorized, confidence clamp >1/<0, payee-null prompt omission. `categorizeService.categorizeBatch` ✅ · gaps: 21-item chunk boundary (2 calls), archived category name from LLM → null, "Uncategorized" as real category. `categorizeUncategorized` · gaps: `total` capped at 200 (201st untouched), mid-loop FK failure leaves partial state, `aiConfidence` written value. `applyCorrection` ⚠ creates duplicate `merchant_exact` rules (no upsert). `ruleRepository` — untested glue.

**Analytics [B]** — `summarize` ✅ · gaps: `amountMinor===0`→income (not in byCategory), all-income empty byCategory, multi-txn category accumulation. `monthlyTrend` ✅ · gaps: boundary date `=from`(incl)/`=to`(excl), single-month, degenerate from===to. `dateRange.resolveRange` ✅ · gaps: `monthRange`/`shiftMonth`/`trailingDays`/`monthKeyOf` untested; `trailingDays` appears unused (dead export).

**Budgets [B]** — `budgetService` ✅ (setBudget upsert, progress, statusOf) · gaps: `removeBudget` unknown id (P2025), `setBudget` bad-category FK, exact `statusOf(0.8)` boundary, income-only month → 0 spend.

**Insights [B]** — `generateInsight` ✅ (weekly under-cap, fallback at cap) · gaps: **monthly path untested** (exercises `detectAnomalies` + monthRange), zero-txn summarize, prompt-content assertion, >6-category truncation. `getRecentInsights` · gap: ordering + `take:10`. `detectAnomalies` ✅ · gaps: custom `opts`, `__none__`/Uncategorized flag, multi-flag sort, exact `floorMinor` boundary (≥10000 included). `costGuard` ✅ · gaps: `INSIGHT_DAILY_LLM_CAP=0`, non-numeric/negative env, race in `recordLlmCall`.

**Categories [B]** — `categoryRepository` ✅ (CRUD + merge) · gaps: rename of archived (silently succeeds), list sort, color/icon passthrough, PATCH-unknown→P2025/404 at HTTP. `seedDefaultTaxonomy` ✅ (re-seed) · ⚠ gap: not transactional — partial seed on mid-crash. `defaultTaxonomy` — static data.

**Q&A [C]** — `qaService` ✅ (extractSql, scalar answer, minor format, write/table rejection, history) · gap: multi-row & 1-row/multi-col `formatAnswer`. `sqlAllowlist` ✅ (adversarial subquery/CTE/UNION/JOIN/PRAGMA/ATTACH) · gaps: built-in `json_each` misclassification, very-long-SQL DoS. `evalRunner` ✅ (rowsMatch, integrity, perfect-model, anti-vacuity). `evalSet` (32 cases) · gap: cross-view JOIN case. `evalFixture` · gap: seeding fails on duplicate category (plain create, no upsert). `voice` ⚠ **no test file** — `getSpeechRecognition`/`transcriptOf` are pure, trivially testable.

**Settings/Money/FX [C]** — `settingService` ✅ · gaps: `""`, `"123"`, padded `" US "`. `convertMinor` ✅ · gaps: `rate=0`→0 (silent zero), negative amount, 0dp currency (JPY — `ponytail: 2dp assumption`), overflow. `exchangeRateClient` ✅ (live+persist, cache fallback, non-ok) · gaps: `rates:null/{}` empty, empty-cache `{}` → downstream `convertMinor(...,undefined)=NaN` ⚠ corrupts money. `exchangeRateRepository` ⚠ **no test file** — `listLatestRates` two-query pattern untested.

**Gate [C]** — `passcode.checkPasscode` ⚠ **no test file** (security-critical): test `(null,"abc")→false`, `("abc","abc")→true`, case-sensitivity, `(*,"")→true`. 

**Shared [§6]** — `db.ts` ⚠ no test (Turso adapter branch untested). `errors.ts` ✅ · gaps: non-P2025 Prisma (P2002) → 500, null throw → 500, empty-body parseJson. `schemas.ts` ⚠ **no test file — highest-value gap** (every txn/budget write depends on it): leap-year dates, amount sign/int rules, currency length, source enum default, budget month 00/13, amount positivity. `geminiKeys` ✅ · gaps: key-51 boundary, whitespace-only. `keyRotation` ✅ · gaps: 403 rotation, cursor-advance after exhaustion, single-key. `geminiClient` ✅ (`callGeminiOnce`) · gap: **`geminiGenerateText` (the public entry-point) untested**; `GEMINI_MODEL` override.

---

## 6. Cross-cutting — assert once

- **Passcode gate (`proxy.ts` + `passcode.ts`):** locked page → 307 `/unlock?next=…`; locked `/api/*` → 401; public (`/unlock`,`/api/unlock`,`/api/health`) → through; prod + no `APP_PASSCODE` → 503 fail-closed; cookie round-trip unlocks UI. (Covered by e2e "passcode gate blocks unauthenticated access", and now also asserted at unit level: `proxy.test.ts` — 8 tests including the production fail-closed 503 the dev-server e2e can't reach — plus `lib/server/passcode.test.ts`.)
- **Error mapping (`errors.ts`):** `ValidationError`→400 verbatim; P2025→404 "not found"; else→500 "request failed" (no internals leak).
- **Health smoke (`/api/health`):** 200 `{ok:true}` (already covered by `e2e/health.spec.ts`).
- **Layout/Nav/CSS:** `<html lang="en">`, `<title>Coinly</title>`, nav present except `/unlock` & `/welcome`.

## 7. End-to-end user flows (Playwright)

The existing `e2e/app.spec.ts` covers the canonical journey: unlock → first-run wizard → manual add → dashboard → transactions → budget → category → settings → ask. Extend with these **uncovered flows**:
1. **CSV import round-trip** — create account → upload generic CSV → verify counts → re-upload → verify all skipped (dedupe).
2. **Debit/credit CSV** — upload CIB-style two-column file → verify debit negative / credit positive.
3. **Auto-categorize** — import uncategorized txns → click Auto-categorize → verify rule matches applied (Gemini mocked/offline → rules-only).
4. **Correction-learning** — set a category on a row → import same merchant again → verify the learned rule auto-applies.
5. **Budget lifecycle** — set → consume to approaching → over → remove.
6. **Category merge** — create two, add txns to source, merge → verify source archived + txns repointed.
7. **Insights fallback** — drive `INSIGHT_DAILY_LLM_CAP=0` → generate → verify "offline report".
8. **Q&A guardrail** — ask a question → verify SELECT-only SQL shown; (unit-level) confirm injection attempts rejected.
9. **Gate negatives** — wrong passcode → error; `?next` open-redirect (`//evil.com`) → must not navigate off-site.

---

## 8. Parallelization plan — 3 independent groups

The work splits into **3 groups that own disjoint editable files/directories** (pages, route files, feature `lib/` dirs, and their `*.test.ts`/e2e specs). They can author tests and polish UI fully in parallel. A small **shared core** (§8.3) is read by all groups but must be **edited by only one owner / serially** — that is the only thing that cannot be parallelized.

### 8.1 File ownership (disjoint)

| | **Group A — Ingest** | **Group B — Analyze** | **Group C — Ask & Configure** |
| --- | --- | --- | --- |
| **Theme** | Get data in | Turn data into insight | Query, configure, gate |
| **Pages** | `app/import/` · `app/quick-add/` · `app/accounts/` · `app/transactions/` (+`TransactionsTable.tsx`) | `app/dashboard/` · `app/budgets/` · `app/insights/` · `app/categories/` | `app/ask/` (+`AskClient.tsx`) · `app/settings/` · `app/page.tsx` · `app/welcome/` · `app/unlock/` |
| **API routes** | `api/import` · `api/accounts` · `api/transactions(+[id])` · `api/categorize` | `api/budgets(+[id])` · `api/insights` · `api/categories(+[id]+[id]/merge)` | `api/qa` · `api/settings` · `api/unlock` · `api/health` |
| **lib/** | `import/**` · `categorize/**` · `repositories/{account,transaction,rule}Repository` | `analytics/**` · `budgets/**` · `insights/**` · `categories/**` · `repositories/categoryRepository` | `qa/**` · `settings/**` · `money/**` · `infra/exchangeRateClient` · `repositories/exchangeRateRepository` · `passcode` · `shared/voice` |
| **Tests own** | new `*.test.ts` beside above + `e2e/ingest.spec.ts` | + `e2e/analyze.spec.ts` | + `e2e/ask-config.spec.ts` |

These three column-sets are mutually file-disjoint — no directory appears in two columns.

### 8.2 Runtime isolation (per group)

| Resource | Group A | Group B | Group C |
| --- | --- | --- | --- |
| Vitest DB (`DATABASE_URL`) | `file:./test-a.db` | `file:./test-b.db` | `file:./test-c.db` |
| Playwright e2e DB | `file:./e2e-a.db` | `file:./e2e-b.db` | `file:./e2e-c.db` |
| Dev/E2E server port | **3101** | **3102** | **3103** |
| Temp/scratch dir | `.tmp/group-a/` | `.tmp/group-b/` | `.tmp/group-c/` |
| Coverage out / test-results | `coverage-a/` · `test-results-a/` | `coverage-b/` · `test-results-b/` | `coverage-c/` · `test-results-c/` |
| `APP_PASSCODE` (e2e) | `a-pass` | `b-pass` | `c-pass` |

Each group's `globalSetup` runs `prisma migrate deploy` against its own DB file (incl. the `v_transactions`/`v_category_totals` views for Group C's Q&A). The current configs hardcode `test.db`/`e2e.db`/port 3000 — parametrize via the env vars above (Vitest projects + Playwright projects) before running groups concurrently. *No code yet — this is the isolation contract.*

> **SUPERSEDED (2026-07-04):** This per-group isolation scheme was used only during the parallel
> worktree phase. On merged `main` the whole suite runs on a **single shared runtime**: Vitest uses
> one serial `test.db` (`fileParallelism: false`), and Playwright runs all 5 specs against one
> `next dev` server on **port 3911** with one `e2e-a.db` and passcode `a-pass`. Cross-spec state is
> handled by the specs themselves (the client pages await their post-mutation refresh, and
> order-fragile assertions were removed). The ports/DBs/passcodes in the tables above are historical.

### 8.3 Cannot be parallelized — shared core (single owner / serial edits)

A perfectly file-disjoint split of *all* files is impossible: the following are imported by ≥2 groups. They may be **read** freely in parallel, but any **edit** (e.g. a fix surfaced by testing) must be serialized through one owner, because a change ripples across groups:

- **`lib/server/db.ts`** — Prisma singleton; every group queries through it. Schema/adapter changes affect the whole suite.
- **`lib/server/errors.ts`** — `apiError`/`parseJson`/`ValidationError`; every route's status mapping.
- **`lib/shared/schemas.ts`** — `transactionInputSchema` (A) + `budgetInputSchema` (B). Editing it touches A and B.
- **`lib/server/infra/geminiClient.ts` + `keyRotation.ts` + `geminiKeys.ts`** — used by categorize **(A)**, insights **(B)**, and qa **(C)**. The one module touching all three groups.
- **`lib/server/settings/settingService.ts`** — owned by C, but read by dashboard & budgets **(B)** (`getBaseCurrency`).
- **`lib/server/categories/seed.ts` + `defaultTaxonomy.ts`** — owned by B, but `seedDefaultTaxonomy()` is called by categorize and the transactions page **(A)**.
- **`lib/server/repositories/categoryRepository.ts`** — owned by B, but read by the transactions page **(A)**.
- **`proxy.ts` + `lib/server/passcode.ts`** — gate every request; a change affects all groups (and all e2e).
- **`app/layout.tsx` · `app/_components/SiteNav.tsx` · `app/globals.css`** — global shell + design system; any visual change cascades to every page in every group.
- **`prisma/schema.prisma` + `prisma/migrations/**`** — one schema; all groups migrate from it.

**Recommended ownership of the shared core:** assign it to **Group C** (it already owns the gate, settings, and AI-infra surface, which is where most of the shared modules live), or treat it as a **"Group 0 / serial" pre-step** done before A/B/C fan out. Either way: freeze the shared core, fan out A/B/C, and re-serialize only if a shared fix is required.

> **Net:** ~95% of the work (all page polish, all endpoint/feature tests, all e2e specs) parallelizes 3-ways with the DB/port/temp isolation above. Only edits to the ~12 shared-core files in §8.3 must be serialized.
