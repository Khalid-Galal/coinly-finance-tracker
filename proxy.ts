import { NextResponse, type NextRequest } from "next/server";
import { checkPasscode, PASSCODE_COOKIE } from "@/lib/server/passcode";

// Next 16 "proxy" convention (replaces the deprecated middleware.ts).
// Demo gate: the deployed instance is locked behind APP_PASSCODE. The user enters it once on
// /unlock, which sets an httpOnly cookie; every page + API request then carries the cookie, so the
// interactive UI (whose client-side fetches can't attach a header) works. Local dev has no gate.

const PUBLIC = ["/unlock", "/api/unlock", "/api/health"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const configured = process.env.APP_PASSCODE ?? "";
  if (!configured) {
    // Fail closed: a deployed (production) instance with no passcode configured must not
    // silently expose everything. Local dev (no passcode) stays open.
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Gate misconfigured: set APP_PASSCODE", { status: 503 });
    }
    return NextResponse.next();
  }

  const header = req.headers.get("x-passcode");
  const cookie = req.cookies.get(PASSCODE_COOKIE)?.value ?? null;
  if (checkPasscode(header, configured) || checkPasscode(cookie, configured)) {
    return NextResponse.next();
  }

  // Not unlocked: API callers get 401; page navigations are redirected to the unlock screen.
  if (pathname.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

// Gate everything except Next internals and static assets.
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
