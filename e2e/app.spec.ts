import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const PASSCODE = "e2e-pass";

// One shared, unlocked context for the whole user journey (cookie + DB state persist across steps).
test.describe.serial("Coinly — full user journey", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({ baseURL: "http://localhost:3000" });
    page = await context.newPage();
    // Unlock wall: a fresh visitor is redirected to /unlock; entering the passcode sets the cookie.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/unlock/);
    await page.getByLabel("Passcode").fill(PASSCODE);
    await page.getByRole("button", { name: "Unlock" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("home shows the first-run setup prompt", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Coinly" })).toBeVisible();
    await expect(page.getByText(/Welcome/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Start setup/i })).toBeVisible();
  });

  test("first-run wizard: set base currency + create first account", async () => {
    await page.goto("/welcome");
    await page.getByLabel("Base currency code").fill("EGP");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByPlaceholder("Account name (e.g. CIB Current)").fill("CIB Current");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(/You're all set/i)).toBeVisible();
  });

  test("manually add a transaction", async () => {
    await page.goto("/quick-add");
    await expect(page.getByRole("heading", { name: "Add transaction" })).toBeVisible();
    await expect(page.locator("select")).toContainText("CIB Current"); // accounts loaded
    await page.getByLabel("Date").fill("2026-06-15");
    await page.getByLabel("Amount").fill("-250.50");
    await page.getByLabel("Description").fill("Groceries Run");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Added.")).toBeVisible();
  });

  test("dashboard renders the summary and trend", async () => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Spending by category")).toBeVisible();
    await expect(page.getByText(/Monthly trend/)).toBeVisible();
    await expect(page.getByText(/transactions in range/)).toBeVisible();
  });

  test("transactions list shows the added row", async () => {
    await page.goto("/transactions");
    await expect(page.getByText("Groceries Run")).toBeVisible();
  });

  test("set a monthly budget and see it saved", async () => {
    await page.goto("/budgets");
    await expect(page.getByRole("heading", { name: "Budgets" })).toBeVisible();
    // Categories are seeded + fetched on load; wait until options exist, then pick the first real one.
    const categorySelect = page.locator('select[name="categoryId"]');
    await expect(categorySelect.locator("option")).not.toHaveCount(1);
    await categorySelect.selectOption({ index: 1 });
    await page.getByPlaceholder(/Amount/).fill("1000");
    await page.getByRole("button", { name: "Set budget" }).click();
    await expect(page.getByText("Budget saved.")).toBeVisible();
  });

  test("create a new category", async () => {
    await page.goto("/categories");
    await page.getByLabel(/New category/).fill("Subscriptions");
    await page.getByRole("button", { name: "Add" }).click();
    // Each category row is an <input aria-label="Rename <name>">.
    await expect(page.getByLabel("Rename Subscriptions")).toBeVisible();
  });

  test("change the base currency in settings", async () => {
    await page.goto("/settings");
    await page.getByLabel("Base currency code").fill("USD");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Base currency saved.")).toBeVisible();
  });

  test("Ask page loads with its input and examples", async () => {
    await page.goto("/ask");
    await expect(page.getByRole("heading", { name: "Ask Coinly" })).toBeVisible();
    await expect(page.getByLabel("Question")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ask", exact: true })).toBeVisible();
  });
});

// Security: the gate blocks an unauthenticated visitor (no cookie).
test("passcode gate blocks unauthenticated access", async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: "http://localhost:3000" });
  const p = await ctx.newPage();
  await p.goto("/budgets");
  await expect(p).toHaveURL(/\/unlock/); // page navigation redirected to the wall
  const api = await p.request.get("/api/accounts");
  expect(api.status()).toBe(401); // API blocked without the cookie/header
  await ctx.close();
});
