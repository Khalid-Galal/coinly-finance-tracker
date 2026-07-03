import { redirect } from "next/navigation";
import { db } from "@/lib/server/db";
import WelcomeClient from "./WelcomeClient";

// Server guard (US-G1): the first-run wizard writes the base currency and creates the first account.
// On the deployed instance, re-running it would overwrite the currency and add a duplicate account,
// so redirect anyone who lands here after setup. Scoped to production (same signal proxy.ts uses):
// in dev/test, re-entering the wizard is intentional and the e2e suite drives /welcome directly.
export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  if (process.env.NODE_ENV === "production" && (await db.account.count()) > 0) redirect("/");
  return <WelcomeClient />;
}
