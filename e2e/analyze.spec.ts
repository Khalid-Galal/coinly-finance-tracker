import { test, expect, type BrowserContext, type Page } from "@playwright/test";

// Group B e2e (TEST_PLAN §7): the analyze journey — dashboard, insights, budget lifecycle,
// category merge. All flows are deterministic and never call the LLM (insight *generation* is
// covered by the service/route unit tests; here we only render the insights page).
// Env-driven so the spec runs under the integrated playwright.config (canonical e2e server),
// matching ingest.spec.ts. Defaults align with the integrated config (port 3911 / a-pass).
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3911";
const PASSCODE = process.env.APP_PASSCODE ?? "a-pass";

test.describe.serial("Coinly — analyze journey", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({ baseURL: BASE });
    page = await context.newPage();
    // Unlock wall: a fresh visitor is redirected to /unlock; the passcode sets the cookie.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/unlock/);
    await page.getByLabel("Passcode").fill(PASSCODE);
    await page.getByRole("button", { name: "Unlock" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    // First-run wizard: base currency + first account (budgets need a transaction to spend).
    await page.goto("/welcome");
    await page.getByLabel("Base currency code").fill("EGP");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByPlaceholder("Account name (e.g. CIB Current)").fill("Main");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(/You're all set/i)).toBeVisible();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("dashboard renders stat cards, range pills, and the trend", async () => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.locator(".stat")).toHaveCount(3); // Income / Expenses / Net
    await expect(page.locator("a.pill")).toHaveCount(4); // this-month / last-month / last-3-months / ytd
    await expect(page.locator("a.pill.active")).toHaveText("this-month"); // default

    // Switching range pills moves the active state and the ?range query.
    await page.getByRole("link", { name: "ytd", exact: true }).click();
    await expect(page).toHaveURL(/range=ytd/);
    await expect(page.locator("a.pill.active")).toHaveText("ytd");

    await expect(
      page.getByRole("heading", { name: "Monthly trend (last 6 months)" }),
    ).toBeVisible();
    await expect(page.getByText(/transactions in range/)).toBeVisible();
  });

  test("insights page renders usage and the empty state without generating", async () => {
    await page.goto("/insights");
    await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();
    await expect(page.getByText(/AI usage today: \d+ \/ \d+/)).toBeVisible();
    await expect(page.getByText("No insights yet. Generate one above.")).toBeVisible();
  });

  test("budget lifecycle: set, consume to over-budget, then remove", async () => {
    // 1) Add an expense and categorise it so it counts as spend for the budget.
    await page.goto("/quick-add");
    await page.getByLabel("Date").fill("2026-06-15");
    await page.getByLabel("Amount").fill("-250.50");
    await page.getByLabel("Description").fill("Dining bill");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Added.")).toBeVisible();

    await page.goto("/transactions");
    const [patch] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/transactions/") && r.request().method() === "PATCH",
      ),
      page.getByLabel("Category for Dining bill").selectOption({ label: "Dining Out" }),
    ]);
    expect(patch.ok()).toBeTruthy();

    // 2) Set a 100.00 budget on Dining Out (current month) → 250.50 spent ⇒ over by 150.50.
    await page.goto("/budgets");
    await page.locator('select[name="categoryId"]').selectOption({ label: "Dining Out" });
    await page.locator('input[name="amount"]').fill("100");
    await page.getByRole("button", { name: "Set budget" }).click();
    await expect(page.getByText("Budget saved.")).toBeVisible();
    await expect(page.getByText(/Over budget by 150\.50/)).toBeVisible();

    // 3) Remove it → the list returns to its empty state.
    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText(/No budgets for .* yet\./)).toBeVisible();
  });

  test("category merge archives the source and keeps the target", async () => {
    await page.goto("/categories");
    for (const name of ["TempA", "TempB"]) {
      await page.getByPlaceholder("e.g. Subscriptions").fill(name);
      await page.getByRole("button", { name: "Add" }).click();
      await expect(page.getByLabel(`Rename ${name}`)).toBeVisible();
    }

    await page.getByLabel("Merge from").selectOption({ label: "TempA" });
    await page.getByLabel("Merge into").selectOption({ label: "TempB" });
    await page.getByRole("button", { name: "Merge", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Merged.");

    await expect(page.getByLabel("Rename TempA")).toHaveCount(0); // source archived, gone from list
    await expect(page.getByLabel("Rename TempB")).toBeVisible(); // target remains
  });
});

// Security: the gate blocks an unauthenticated visitor on a Group B page + API.
test("passcode gate blocks unauthenticated access to budgets", async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: BASE });
  const p = await ctx.newPage();
  await p.goto("/budgets");
  await expect(p).toHaveURL(/\/unlock/);
  const api = await p.request.get("/api/budgets?month=2026-06");
  expect(api.status()).toBe(401);
  await ctx.close();
});
