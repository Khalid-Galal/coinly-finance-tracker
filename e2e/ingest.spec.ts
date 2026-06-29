import { test, expect, type BrowserContext, type Page } from "@playwright/test";

// GROUP_A (Ingest) e2e: account creation -> CSV import round-trip -> dedupe -> debit/credit -> list.
// Self-contained (creates its own account) and offline-safe: no auto-categorize, so no LLM/network.
// Port/DB/passcode are isolated to Group A via playwright.config.ts (free port, e2e-a.db, a-pass).
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3911";
const PASSCODE = process.env.APP_PASSCODE ?? "a-pass";

const GENERIC_CSV = [
  "date,amount,description,currency",
  "2026-05-01,150.50,Costa Coffee,EGP",
  "2026-05-02,-2000,Rent,EGP",
  "2026-05-03,500,Refund,EGP",
].join("\n");

const DEBIT_CREDIT_CSV = [
  "Date,Description,Debit,Credit,Balance",
  "2026-05-10,Carrefour Maadi,250.00,,9750.00",
  "2026-05-15,Salary,,5000.00,14750.00",
].join("\n");

async function uploadCsv(page: Page, csv: string, name: string) {
  await page.getByLabel("CSV file to import").setInputFiles({
    name,
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await page.getByRole("button", { name: "Import", exact: true }).click();
}

test.describe.serial("Ingest — CSV import round-trip", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({ baseURL: BASE });
    page = await context.newPage();
    await page.goto("/import");
    await expect(page).toHaveURL(/\/unlock/);
    await page.getByLabel("Passcode").fill(PASSCODE);
    await page.getByRole("button", { name: "Unlock" }).click();
    await expect(page).toHaveURL(/\/import$/);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("create an account to import into", async () => {
    await page.goto("/accounts");
    await page.getByLabel("Account name").fill("Ingest Bank");
    await page.getByRole("button", { name: "Add account" }).click();
    await expect(page.getByText("Ingest Bank (bank, EGP)")).toBeVisible();
  });

  test("imports a generic CSV, then skips all rows on re-import (dedupe)", async () => {
    await page.goto("/import");
    // Only one account exists, so the import form auto-selects it.
    await uploadCsv(page, GENERIC_CSV, "generic.csv");
    await expect(page.getByText("Imported 3, skipped 0.")).toBeVisible();

    await page.goto("/import");
    await uploadCsv(page, GENERIC_CSV, "generic.csv");
    await expect(page.getByText("Imported 0, skipped 3.")).toBeVisible();
  });

  test("imports a debit/credit (CIB-style) CSV — both columns", async () => {
    await page.goto("/import");
    await uploadCsv(page, DEBIT_CREDIT_CSV, "cib.csv");
    await expect(page.getByText("Imported 2, skipped 0.")).toBeVisible();
  });

  test("transactions list shows the imported rows with signed amounts", async () => {
    await page.goto("/transactions");
    await expect(page.getByText("Costa Coffee")).toBeVisible();
    await expect(page.getByText("Carrefour Maadi")).toBeVisible();
    // Debit stored negative, credit positive (TransactionsTable renders minor/100).
    await expect(page.getByText("-250.00 EGP")).toBeVisible();
    await expect(page.getByText("5000.00 EGP")).toBeVisible();
  });
});
