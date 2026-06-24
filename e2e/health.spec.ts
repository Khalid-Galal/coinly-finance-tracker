import { test, expect } from "@playwright/test";

test("health endpoint responds ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toEqual({ ok: true });
});
