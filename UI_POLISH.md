# Coinly — UI Polish Checklist

> Companion to [`TEST_PLAN.md`](./TEST_PLAN.md) (functional) and [`DESIGN.md`](./DESIGN.md) (architecture).
> Per-screen visual/interaction QA: **spacing & alignment**, **loading / empty / error states**,
> **responsive breakpoints**, **contrast & accessibility**. Every check is concrete and observed in
> the current JSX/CSS — not generic advice. Group tags **[A]/[B]/[C]** match the parallelization plan
> in `TEST_PLAN.md` §8 (screens are file-disjoint per group; the **Global** section §1 is shared-core,
> single-owner). Design system: emerald/teal (`--brand` / `--brand-dark #0f766e`), `system-ui` stack.

## How to verify
- **Breakpoints to test on every screen:** 320 px (small phone), 375 px, 768 px (tablet), 1024 px, 1440 px.
- **States to force:** initial load (throttle network to "Slow 3G"), empty (fresh DB), error (offline / 500), success.
- **A11y pass:** keyboard-only tab traversal, visible focus ring, screen-reader (NVDA/VoiceOver) landmark + label sanity, Lighthouse/axe contrast audit, 200% zoom.

---

## Status (2026-07-04)

Executed since this checklist was written (treat the per-screen notes below as the *original*
findings):

- **P1 accessibility (global):** skip-nav link + `<main id="main-content">`, `aria-current="page"` on the active nav, nav idle-link contrast raised to AA (≥ 4.5:1), a `:focus-visible` ring, and `aria-hidden` on the brand dot (`layout.tsx` / `SiteNav.tsx` / `globals.css`). Added a favicon (`app/icon.svg`) + OpenGraph tags.
- **P1 per-screen:** budget progress bars now expose `role="progressbar"` + `aria-value*`; the dashboard trend chart has `role="img"` + a spoken data summary, and the Net card is colour-cued by sign.
- **P2 state feedback (promoted to bug fixes):** unlock / insights / settings / quick-add / accounts / budgets now surface fetch/POST failures instead of failing silently, with distinct success/error colours (via the existing `--danger`/`--success` tokens); categories / accounts / budgets await their post-mutation refresh (fixed a real ordering race).
- **Security:** unlock is rate-limited; the `/welcome` re-run guard blocks re-setup on the live instance.

**Still open** (lower priority): loading skeletons (P2-6), remaining single-row form `flex-wrap`
(P3-9), mobile nav collapse (P3-10), legacy table attributes (P4-12), full inline-hex → token
migration + `prefers-color-scheme: dark` (P4-13).

---

## 1. Global / cross-screen (shared core — single owner) **[C4]**

Files: `app/layout.tsx` · `app/_components/SiteNav.tsx` · `app/globals.css`. Fixing these improves every screen at once — prioritize.

| Check | Status / finding |
| --- | --- |
| **Skip-navigation link** | ❌ Missing. No `<a href="#main-content">Skip to main content</a>`; no `<main id="main-content">`. Keyboard users tab through all 8 nav items on every page (WCAG 2.4.1 fail). |
| **Active-page semantics** | ❌ Active nav link has only `class="active"`, no `aria-current="page"`. Screen readers can't announce current page. Add `aria-current={active ? "page" : undefined}`. |
| **Nav link contrast** | ⚠ Idle links `rgba(255,255,255,0.82)` on `#0f766e` ≈ **3.8:1** at 0.92rem → below AA 4.5:1. Active (`#fff`) ≈ 5:1 passes. Bump idle opacity to ≥ 0.92 or darken the bar. |
| **Mobile nav** | ❌ No hamburger/collapse. At <600 px the 7 links + brand `flex-wrap` to a second row, eating vertical space. Add a collapse or horizontal scroll. |
| **Focus ring** | ⚠ No explicit `:focus-visible` on `.site-nav__links a`; relies on browser default which may be suppressed by inherited `outline:none`. Add a visible ring. |
| **Dark mode** | ❌ No `prefers-color-scheme: dark`. OS dark-mode users get the light teal theme. Many pages also hardcode hex inline (see below), so a token-based theme is a prerequisite. |
| **Variable-font weights** | ⚠ `font-weight: 550 / 650` used; on systems without a variable font in `system-ui` these snap to 500/600 — intended hierarchy becomes undefined. Use standard 400/500/600/700. |
| **Favicon / metadata** | ⚠ No `<link rel="icon">` or OG tags; tab shows generic icon. `metadata` only sets title/description. |
| **Brand dot a11y** | Minor: `.site-nav__brand .dot` ("C") has no `aria-hidden` → SR reads "C Coinly" (redundant, not harmful). |
| **Design-token consistency** | ⚠ Several screens use inline hardcoded hex (`#666`, `#555`, `#b00`, `#2a8a4a`, `#d23535`, `#e08a00`) instead of CSS variables — blocks theming and risks contrast drift. Migrate to tokens. |

**Recurring patterns to fix once, apply everywhere** (each appears on most client pages):
1. **No loading state** — client pages start with empty arrays/null, so the empty-state text flashes before data arrives. Add a skeleton/spinner or a `loading` flag.
2. **Status message colour** — success and error often share one grey (`#555`); give error a distinct red and success a green, and ensure `role="status"`/`aria-live="polite"` (some have it, some don't).
3. **Single-row flex forms** — inline `display:flex; gap:8` rows with no `flex-wrap` overflow at <400 px. Add `flex-wrap: wrap` + min-widths.
4. **Silent fetch failures** — most `useEffect` fetches have no `.catch()`; a 401/500/offline leaves a blank or misleading empty-state with no message. Add error state copy.

---

## 2. Per-screen checks

### `/` — Home **[C]**
- **Spacing/Alignment:** `<main>` has no `className`/max-width → content spans full viewport, looks unstyled on desktop. Wrap in the standard card/container width.
- **States:** RSC, server-rendered — no loading needed. First-run card is the de-facto "empty state" (good). No error boundary if DB read fails.
- **Responsive:** unconstrained width; fine on mobile, sparse on desktop.
- **Contrast/A11y:** health link is grey small text (`#666`, 13px) — low emphasis, easy to miss, check 4.5:1. No `<nav>` landmark around the links `<ul>`.

### `/welcome` — Wizard **[C]**
- **Spacing/Alignment:** `maxWidth:520` reasonable; step indicator is an `<ol>` with `listStyle:none` (not semantically a step list).
- **States:** error paragraph has `minHeight:1.2em` (no layout shift) ✓; **no spinner** on "Create account" while busy (button text doesn't change); mount settings fetch fails silently.
- **Responsive:** no narrow-screen padding handling — content can flush to edge at 320 px.
- **Contrast/A11y:** currency input has `aria-label` ✓; **account-name input has only a placeholder, no label/aria-label** (placeholder vanishes on focus); add `aria-current="step"` to the active step; `<select name="type">` lacks `aria-label` (terse "Type:" label).

### `/unlock` — Gate **[C]** (no SiteNav)
- **Spacing/Alignment:** `maxWidth:360` suits a login form ✓.
- **States:** error `role="status"`+`aria-live` + `minHeight` ✓; busy → button "…" (minimal, no spinner); **network error sets no message** (button just re-enables).
- **Responsive:** narrow form is fine.
- **Contrast/A11y:** `type="password"` masks ✓; input has `aria-label` but **no `<label for>`** (prefer explicit label); no sub-heading clarifying this is the unlock screen (the `<p>` explains).

### `/dashboard` — Overview **[B]**
- **Spacing/Alignment:** stat grid + pills + table generally aligned; category bar `Math.max(2, … *240)` caps at 240px — verify it doesn't overflow its container at narrow widths. `<table cellPadding={4}>` uses deprecated HTML attr (use CSS padding).
- **States:** RSC `force-dynamic`, **no `<Suspense>`** — slow DB stalls the whole page (blank, then full render); empty range → "No expenses in this range." ✓; **no error boundary** → 500 page on DB failure.
- **Responsive:** category table inside `.table-scroll` (horizontal scroll) ✓; verify 6-bar chart + stat cards reflow at 320–768 px.
- **Contrast/A11y:** **chart is inaccessible** — bars convey value only via `title` on `<div>` (SR-unreliable), no `role="img"`/`aria-label`; chart colours hardcoded `#2a8a4a`/`#d23535` (not tokens, no dark mode); Net card has **no colour cue** for negative; month labels `26-01` terse/ambiguous (reads like a range); no `<caption>` on category table; pills are full-nav `<a>` (page reload, not client transition).

### `/transactions` — List **[A]**
- **Spacing/Alignment:** `<table border={1} cellPadding={6}>` — legacy attributes, not the emerald/teal design system; table styling inconsistent with the rest of the app.
- **States:** empty → "No transactions yet." ✓; no `<Suspense>`/skeleton for slow query; per-row select disables (`busy===id`) during PATCH ✓.
- **Responsive:** wrapper `.table-scroll` gives horizontal scroll ✓; no pagination → very long DOM table on large datasets.
- **Contrast/A11y:** row select `aria-label="Category for <desc>"` ✓; **no income/expense colour distinction** on amounts; nav links `className="muted"` — verify muted contrast; **PATCH errors give no visible feedback** (select silently reverts).

### `/quick-add` — Manual entry **[A]**
- **Spacing/Alignment:** date + amount share one `<p>` line separated by a space → wrap awkwardly on narrow screens (no flex/grid).
- **States:** **no loading indicator** while accounts load (brief empty-state flash); status `<p>` has **no `role="alert"`/`aria-live`** (SR misses "Added.").
- **Responsive:** inline inputs, no responsive layout — verify 320 px.
- **Contrast/A11y:** date/amount use `aria-label` only (no `<label>` wrapper); heading jumps `<h1>` → labels with no `<fieldset>/<legend>`.

### `/accounts` — Accounts **[A]**
- **Spacing/Alignment:** create form is one inline row (`<input> <input> <input> <button>`) space-separated → collapses poorly on mobile; account list is plain `<ul>/<li>` text (no table, no balances, no edit/delete).
- **States:** **no loading state** (empty `<ul>` until fetch); **no empty-state copy** when zero accounts (just the form over a blank list); status `<p>` no `role="alert"`.
- **Responsive:** single-row form overflows < ~400 px (no `flex-wrap`).
- **Contrast/A11y:** inputs have `aria-label`s ✓; `type` is free-text (no `<datalist>`/`<select>` for bank/cash/credit); currency has `maxLength=3` but no min (2 chars submittable).

### `/budgets` — Budgets **[B]**
- **Spacing/Alignment:** form is `display:flex; gap:8; alignItems:center` single row → select+number+button overflow < ~400 px (no `flex-wrap`); `<main maxWidth:640>` just grows downward (no scroll container) with many budgets.
- **States:** **no loading skeleton** → "No budgets for YYYY-MM yet." flashes on first render; fetch failure or 500 → also shows "No budgets yet" (misleading, no error copy); success & error msgs both `#555` grey (**indistinguishable**).
- **Responsive:** form not responsive; progress bars (240px-ish) verify at narrow widths.
- **Contrast/A11y:** **progress bar has no ARIA** (`role="progressbar"`, `aria-valuenow/min/max` missing); status conveyed by **colour alone** (ok/warn/over) → WCAG 1.4.1 fail, add icon/text; select & number input have **no `<label for>`** (placeholder/name only); Remove button is 12px, **no min touch target, no confirmation** (mis-tap deletes).

### `/insights` — AI insights **[B]**
- **Spacing/Alignment:** `<main maxWidth:680>` with no padding declaration → can flush to edge depending on parent; insight cards `<p margin:6px 0 0>` with no font-size/line-height → dense long AI text.
- **States:** **no loading spinner** (null data indistinguishable from empty "No insights yet."); **fetch & POST failures fully silent** (no error UI); long `content` → unbounded card height (no clamp/expand).
- **Responsive:** verify card stack + two generate buttons at 320 px.
- **Contrast/A11y:** usage-cap red `#b00`; anomaly box uses `⚠` emoji with **no `role="alert"`/`aria-label`**; both generate buttons share `disabled={!!busy}` with no tooltip explaining why the second is disabled.

### `/categories` — Manage **[B]**
- **Spacing/Alignment:** `<main maxWidth:560>`; merge form `flexWrap:wrap` ✓ but selects have no explicit width → may overflow at very narrow widths; **"Add" uses `.btn-primary` while Save/Archive/Merge use no class** → visual inconsistency; `<h2 fontSize:18>` overrides default (verify heading scale vs nav `h1`).
- **States:** **no loading skeleton / no empty copy** during initial fetch (blank list); `load()` errors **silently swallowed** (no `.catch`); **`msg` never auto-clears** (stale status lingers).
- **Responsive:** verify inline-edit rows + merge selects at 320–375 px.
- **Contrast/A11y:** status `role="status"`+`aria-live`+`minHeight` ✓ but `#555` on white < 4.5:1 (check); rename inputs + merge selects have `aria-label`s ✓; **`window.confirm` for archive** — not keyboard-friendly/styleable, blocks thread; **no focus management** after archive/reload; **flat list** — no visual parent/child hierarchy.

### `/ask` — Q&A **[C]**
- **Spacing/Alignment:** `<main>` in `page.tsx` has **no class/padding/max-width** → content flush to viewport edge on all sizes; results `<table border={1}>` inline-styled (not design-system); SQL `<pre>` has `overflowX:auto` ✓ but the results table has **no overflow wrapper** (wide tables overflow).
- **States:** **no result-area skeleton** during `busy` (only "Asking…" on the button); empty/space input silently dropped (no feedback); mic error → no message.
- **Responsive:** unstyled `<main>` + wide table = horizontal overflow risk on mobile; add a `.table-scroll` wrapper.
- **Contrast/A11y:** input `aria-label="Question"` and mic `aria-label/title="Ask by voice"` ✓; error `#b00` ≈ 5.7:1 passes; **no `aria-live` for the "🎙 Listening…" state**; **example chips not disabled during busy** (input changes, no request → confusing); error colour inline, not a token.

### `/settings` — Base currency **[C]**
- **Spacing/Alignment:** inline flex row (label+input+button) may wrap and misalign at narrow widths.
- **States:** **no loading state** (input blank, `<strong>` shows "…", no spinner); **no error state** if GET fails (can't tell loading from failed); busy disables Save ✓.
- **Responsive:** verify the single row at 320 px.
- **Contrast/A11y:** status `role="status"`+`aria-live`+`minHeight` ✓; `<label>` wraps input AND redundant `aria-label` (harmless, but `aria-label` wins as the accessible name); `maxLength=3` matches server regex ✓; no `autocomplete` attr (browser may suggest unwanted values).

---

## 3. Consolidated polish backlog (priority order)

**P1 — accessibility blockers (do once, global):**
1. Add skip-nav link + `<main id>` (Global).
2. `aria-current="page"` on active nav (Global).
3. Fix nav idle-link contrast to ≥ 4.5:1 (Global).
4. Budget progress bar ARIA + don't rely on colour alone for status (`/budgets`).
5. Dashboard chart `role="img"` + `aria-label` per bar; add Net colour cue (`/dashboard`).

**P2 — state feedback (per-screen, parallelizable):**
6. Add loading skeletons to all client pages (kills the empty-state flash): quick-add, accounts, budgets, insights, categories, settings, ask.
7. Distinct success vs error colours + `aria-live` on every status message.
8. Surface fetch/POST failures instead of silent blanks: insights, settings, categories, ask, welcome, unlock-network-error.

**P3 — responsive (per-screen):**
9. `flex-wrap` + min-widths on all single-row forms: quick-add, accounts, budgets, settings.
10. Mobile nav collapse (Global).
11. `.table-scroll` wrapper on the `/ask` results table; constrain `/ask` `<main>` width.

**P4 — consistency / theming:**
12. Replace legacy `border`/`cellPadding` table attrs with design-system table styles (transactions, dashboard, ask).
13. Migrate inline hex to CSS tokens; then add `prefers-color-scheme: dark` (Global).
14. Normalize button classing (e.g. `/categories` Add vs others); standard font weights.

---

## 4. Parallelization (matches `TEST_PLAN.md` §8)

UI polish splits the same 3 ways — screens are file-disjoint:

- **Group A** — `/import`, `/quick-add`, `/accounts`, `/transactions` (+`TransactionsTable`).
- **Group B** — `/dashboard`, `/budgets`, `/insights`, `/categories`.
- **Group C** — `/ask` (+`AskClient`), `/settings`, `/`, `/welcome`, `/unlock`.
- **Shared core (§1)** — `layout.tsx`, `SiteNav.tsx`, `globals.css`: **single owner / serial** (a CSS or nav change cascades to all screens). Recommend Group C owns it or it is done as a pre-step before A/B/C fan out.

Runtime isolation (separate test DB / port / temp dir per group) is identical to `TEST_PLAN.md` §8.2 — visual-regression snapshots, if added, write to each group's own `test-results-<x>/` directory.
