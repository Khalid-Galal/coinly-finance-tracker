import { checkPasscode, PASSCODE_COOKIE } from "@/lib/server/passcode";

// Public route (allowlisted in proxy.ts). Validates the demo passcode and sets the unlock cookie.
export async function POST(req: Request) {
  const configured = process.env.APP_PASSCODE ?? "";
  let passcode: unknown;
  try {
    ({ passcode } = (await req.json()) as { passcode?: unknown });
  } catch {
    passcode = null;
  }

  if (!checkPasscode(typeof passcode === "string" ? passcode : null, configured)) {
    return Response.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const res = Response.json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    `${PASSCODE_COOKIE}=${encodeURIComponent(configured)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secure}`,
  );
  return res;
}
