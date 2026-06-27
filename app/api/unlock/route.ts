import { NextResponse } from "next/server";
import { checkPasscode, PASSCODE_COOKIE } from "@/lib/server/passcode";

// Public route (allowlisted in proxy.ts). Validates the demo passcode and sets the unlock cookie.
export async function POST(req: Request) {
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
