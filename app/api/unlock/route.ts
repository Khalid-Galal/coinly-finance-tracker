import { NextResponse } from "next/server";
import { checkPasscode, PASSCODE_COOKIE } from "@/lib/server/passcode";
import { rateLimit, resetRateLimit } from "@/lib/server/rateLimit";

// Public route (allowlisted in proxy.ts). Validates the demo passcode and sets the unlock cookie.
// Rate-limited per client IP so the only auth surface can't be brute-forced (there's no other gate).
const UNLOCK_LIMIT = 10;
const UNLOCK_WINDOW_MS = 60_000;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `unlock:${ip}`;
  if (!rateLimit(key, UNLOCK_LIMIT, UNLOCK_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const configured = process.env.APP_PASSCODE ?? "";
  let passcode: unknown;
  try {
    ({ passcode } = (await req.json()) as { passcode?: unknown });
  } catch {
    passcode = null; // malformed body -> treat as a wrong passcode (401), not a 400
  }

  if (!checkPasscode(typeof passcode === "string" ? passcode : null, configured)) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  resetRateLimit(key); // a correct passcode clears the counter so a legit user is never stuck

  // Demo gate: the cookie value is the shared passcode itself (httpOnly). Fine for a single-user
  // demo — it's not a real session token; the proxy verifies it with checkPasscode.
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PASSCODE_COOKIE, configured, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 86400,
  });
  return res;
}
