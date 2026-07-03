// Seeds realistic demo data (accounts + ~3 months of categorized transactions + budgets)
// so the dashboard, insights, and Q&A aren't empty for the graded demo (PRE_SUBMISSION A2).
//
// Seeds THROUGH THE API, so it works against the deployed instance from your laptop — the
// Render disk isn't reachable directly. Point it wherever the app is running:
//
//   BASE_URL=http://localhost:3000 APP_PASSCODE=... node scripts/seed-demo.mjs
//   BASE_URL=https://coinly-kpdh.onrender.com APP_PASSCODE=coinly-demo-2026 node scripts/seed-demo.mjs
//
// Idempotency: bails if accounts already exist (re-running would 500 on the unique dedupeHash).
// Pass --force to seed anyway (adds duplicates). ponytail: guard-and-bail beats a reset endpoint.

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const PASSCODE = process.env.APP_PASSCODE ?? "";
const FORCE = process.argv.includes("--force");

let cookie = "";

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (setCookie.length) cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  }
  return data;
}

const minor = (egp) => Math.round(egp * 100);
const pad = (n) => String(n).padStart(2, "0");
const ym = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const iso = (y, m, day) => `${y}-${pad(m)}-${pad(day)}`;

// One month's worth of recurring transactions. Signed amounts: income positive, spend negative.
// `bump` nudges amounts per month so figures vary month-to-month (and it reads like real spending).
function monthTransactions(year, month, cat, bump) {
  const t = (day, description, egp, categoryName) => ({
    date: iso(year, month, day),
    description,
    amountMinor: minor(egp),
    categoryId: cat[categoryName],
    categoryName,
  });
  return [
    t(28, "Monthly salary", 25000, "Salary"),
    t(1, "Apartment rent", -8000, "Rent"),
    t(5, "Vodafone internet + phone", -600, "Internet & Phone"),
    t(3, "Netflix subscription", -170, "Streaming"),
    t(10, "Electricity + water", -(450 + bump * 30), "Utilities"),
    t(6, "Carrefour groceries", -(720 + bump * 40), "Groceries"),
    t(16, "Seoudi supermarket", -(410 + bump * 25), "Groceries"),
    t(24, "Gourmet grocery run", -(360 + bump * 20), "Groceries"),
    t(9, "Dinner at Zooba", -(280 + bump * 15), "Dining Out"),
    t(19, "Lunch with team", -(220 + bump * 10), "Dining Out"),
    t(12, "Petrol - Wataniya", -(500 + bump * 30), "Fuel"),
    t(7, "Uber to office", -95, "Ride-hailing"),
    t(21, "Uber airport", -(180 + bump * 10), "Ride-hailing"),
    t(14, "El Ezaby pharmacy", -(250 + bump * 20), "Pharmacy"),
    ...(bump === 1 ? [t(18, "New winter jacket", -1200, "Clothing")] : []),
    ...(bump === 2 ? [t(22, "Amazon order", -640, "General")] : []),
  ];
}

async function main() {
  console.log(`Seeding ${BASE} ...`);
  await api("POST", "/api/unlock", { passcode: PASSCODE });

  const existing = await api("GET", "/api/accounts");
  if (Array.isArray(existing) && existing.length > 0 && !FORCE) {
    console.log(
      `Already seeded (${existing.length} account(s)). Re-running would duplicate rows. ` +
        `Pass --force to seed anyway, or reset the DB first.`,
    );
    return;
  }

  await api("PUT", "/api/settings", { baseCurrency: "EGP" });

  // GET triggers the default-taxonomy seed; build name -> id for leaf categories.
  const categories = await api("GET", "/api/categories");
  const cat = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  const need = ["Salary", "Rent", "Internet & Phone", "Streaming", "Utilities", "Groceries",
    "Dining Out", "Fuel", "Ride-hailing", "Pharmacy", "Clothing", "General"];
  const missing = need.filter((n) => !cat[n]);
  if (missing.length) throw new Error(`Missing expected categories: ${missing.join(", ")}`);

  const accounts = [];
  for (const a of [
    { name: "CIB Current", type: "bank", currency: "EGP" },
    { name: "Cash Wallet", type: "cash", currency: "EGP" },
  ]) {
    accounts.push(await api("POST", "/api/accounts", a));
  }
  const primary = accounts[0].id;

  // Three months ending this month.
  const now = new Date();
  const months = [2, 1, 0].map((back) => {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1, bump: 2 - back };
  });

  let txCount = 0;
  for (const { year, month, bump } of months) {
    for (const tx of monthTransactions(year, month, cat, bump)) {
      await api("POST", "/api/transactions", {
        accountId: primary,
        date: tx.date,
        amountMinor: tx.amountMinor,
        currency: "EGP",
        description: tx.description,
        categoryId: tx.categoryId,
        source: "manual",
      });
      txCount++;
    }
  }

  const thisMonth = ym(now);
  const budgets = [
    { categoryName: "Groceries", egp: 3000 },
    { categoryName: "Dining Out", egp: 1500 },
    { categoryName: "Fuel", egp: 1200 },
  ];
  for (const b of budgets) {
    await api("POST", "/api/budgets", {
      categoryId: cat[b.categoryName],
      month: thisMonth,
      amountMinor: minor(b.egp),
      currency: "EGP",
    });
  }

  console.log(
    `Done: ${accounts.length} accounts, ${txCount} transactions across 3 months, ${budgets.length} budgets (${thisMonth}).`,
  );
  console.log("Tip: open Transactions -> Auto-categorize is optional; rows are already categorized.");
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
