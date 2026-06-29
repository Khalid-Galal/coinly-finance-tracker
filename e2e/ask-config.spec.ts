import { test, expect, type BrowserContext, type Page } from "@playwright/test";

// GROUP_C (Ask & Configure) e2e — net-new flows the canonical app.spec.ts does not cover:
//  - settings base-currency round-trip that PERSISTS across a reload (real backend),
//  - the Ask page rendering an answer + generated-SQL deterministically (POST /api/qa is
//    intercepted, so no Gemini key / quota is needed),
//  - gate negatives: wrong passcode, a valid ?next redirect, and the open-redirect guard.
// Port/DB/passcode are isolated to Group C via playwright.config.ts (port 3913, e2e-c.db, c-pass).
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3913";
const PASSCODE = process.env.APP_PASSCODE ?? "c-pass";

async function unlock(page: Page, next = "") {
  await page.goto(`/unlock${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  await expect(page.getByLabel("Passcode")).toBeVisible();
  await page.getByLabel("Passcode").fill(PASSCODE);
  await page.getByRole("button", { name: "Unlock" }).click();
}

test.describe.serial("Ask & Configure — authenticated flows", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({ baseURL: BASE });
    page = await context.newPage();
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/unlock/);
    await page.getByLabel("Passcode").fill(PASSCODE);
    await page.getByRole("button", { name: "Unlock" }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("settings: base currency saves and persists across a reload", async () => {
    await page.goto("/settings");
    await page.getByLabel("Base currency code").fill("USD");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Base currency saved.")).toBeVisible();
    // Persistence: reload re-fetches GET /api/settings and prefills the stored value.
    await page.reload();
    await expect(page.locator("strong")).toHaveText("USD");
  });

  test("ask: renders the answer, the result table, and the generated SQL (intercepted /api/qa)", async () => {
    await page.route("**/api/qa", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          question: "how much did I spend?",
          sql: "SELECT SUM(amountMinor) AS totalMinor FROM v_transactions",
          rows: [{ totalMinor: 12345 }],
          answer: "totalMinor: 123.45",
        }),
      });
    });

    await page.goto("/ask");
    await expect(page.getByRole("heading", { name: "Ask Coinly" })).toBeVisible();
    await page.getByLabel("Question").fill("how much did I spend?");
    await page.getByRole("button", { name: "Ask", exact: true }).click();

    await expect(page.getByText("totalMinor: 123.45")).toBeVisible(); // answer paragraph
    const sql = page.getByText("Show generated SQL");
    await expect(sql).toBeVisible();
    await sql.click(); // expand the <details>
    await expect(page.getByText("FROM v_transactions")).toBeVisible();
    // minor-suffixed column is divided by 100 in the table cell.
    await expect(page.locator("td")).toHaveText("123.45");

    await page.unroute("**/api/qa");
  });

  test("ask: an example chip fills the input and fires a request", async () => {
    await page.route("**/api/qa", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          question: "x",
          sql: "SELECT 1 AS n",
          rows: [{ n: 1 }],
          answer: "n: 1",
        }),
      });
    });

    await page.goto("/ask");
    await page.getByRole("button", { name: "How much did I spend on Dining this month?" }).click();
    await expect(page.getByLabel("Question")).toHaveValue(
      "How much did I spend on Dining this month?",
    );
    await expect(page.getByText("n: 1")).toBeVisible();

    await page.unroute("**/api/qa");
  });
});

test.describe("Ask & Configure — passcode gate negatives", () => {
  test("wrong passcode shows an error and stays on /unlock", async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE });
    const page = await ctx.newPage();
    await page.goto("/unlock");
    await page.getByLabel("Passcode").fill("definitely-wrong");
    await page.getByRole("button", { name: "Unlock" }).click();
    await expect(page.getByText("Incorrect passcode.")).toBeVisible();
    await expect(page).toHaveURL(/\/unlock/);
    await ctx.close();
  });

  test("a same-origin ?next path is honored after unlock", async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE });
    const page = await ctx.newPage();
    await unlock(page, "/settings");
    await expect(page).toHaveURL(/\/settings$/);
    await ctx.close();
  });

  test("an off-site ?next (//evil.com open redirect) is blocked — lands on the app, not off-site", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ baseURL: BASE });
    const page = await ctx.newPage();
    const expectedHost = new URL(BASE).host;
    await unlock(page, "//evil.com/phish");
    // The guard rejects the protocol-relative target and redirects to "/" instead of off-site.
    // (waitForURL on the host alone would match the /unlock URL instantly — wait for the landing.)
    await page.waitForURL((u) => u.host === expectedHost && u.pathname === "/");
    const landed = new URL(page.url());
    expect(landed.host).toBe(expectedHost);
    expect(landed.pathname).toBe("/");
    await ctx.close();
  });

  test("unauthenticated: page navigation redirects to /unlock and the API is 401", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ baseURL: BASE });
    const page = await ctx.newPage();
    await page.goto("/ask");
    await expect(page).toHaveURL(/\/unlock/);
    const res = await page.request.get("/api/settings");
    expect(res.status()).toBe(401);
    await ctx.close();
  });
});
