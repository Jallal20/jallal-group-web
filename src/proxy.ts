import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/session";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/api/admin/login"]);

/**
 * Fast first-line gate: unauthenticated requests never reach admin pages or
 * admin APIs. Real authorisation (role check against Appwrite) still happens
 * in every server route and page via getCurrentAdmin().
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE));

  if (hasSession) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "Sign-in required." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
