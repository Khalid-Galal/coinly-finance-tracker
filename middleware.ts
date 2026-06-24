import { NextResponse, type NextRequest } from "next/server";
import { checkPasscode } from "@/lib/server/passcode";

export function middleware(req: NextRequest) {
  // Health check stays public — uptime probes and deploy smoke tests must reach it.
  if (req.nextUrl.pathname === "/api/health") return NextResponse.next();

  const configured = process.env.APP_PASSCODE ?? "";
  // Fail closed: a deployed (production) instance with no passcode configured must not
  // silently expose every API route.
  if (process.env.NODE_ENV === "production" && !configured) {
    return new NextResponse("Gate misconfigured", { status: 503 });
  }

  const ok = checkPasscode(req.headers.get("x-passcode"), configured);
  return ok ? NextResponse.next() : new NextResponse("Unauthorized", { status: 401 });
}

export const config = { matcher: "/api/:path*" };
