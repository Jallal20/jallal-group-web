import { NextResponse } from "next/server";

// Patch undici's fetch before node-appwrite loads it (Cloudflare Workers
// does not support the ALPNProtocols option that undici passes by default).
import "@/lib/undici-fetch-patch";

import { Account, AppwriteException } from "node-appwrite";
import { adminClient } from "@/lib/appwrite";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth";
import { ADMIN_SESSION_MAX_AGE } from "@/lib/session";
import { isAppwriteConfigured } from "@/lib/env";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicAccountClient(): Account {
  // Session creation uses the server API key so that Appwrite returns the
  // session secret. The SDK only includes `secret` when the request was made
  // with an API key (models.d.ts: "Only included if the request was made
  // with an API key"). The key never leaves the server.
  return new Account(adminClient());
}

export async function POST(request: Request) {
  if (!isAppwriteConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        code: "not_configured",
        message:
          "Admin sign-in is unavailable: Appwrite is not configured for this deployment.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const limited = rateLimit(`admin-login:${clientKey(request)}`, {
    max: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!limited.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: "rate_limited",
        message: "Too many sign-in attempts. Please wait and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limited.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      {
        ok: false,
        code: "validation",
        message: "Email and password are required.",
      },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const session = await publicAccountClient().createEmailPasswordSession({
      email,
      password,
    });

    const cookieValue = `${ADMIN_SESSION_COOKIE}=${session.secret}; Path=/; Max-Age=${ADMIN_SESSION_MAX_AGE}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

    return NextResponse.json(
      { ok: true, message: "Signed in." },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "Set-Cookie": cookieValue,
        },
      },
    );
  } catch (error) {
    if (error instanceof AppwriteException) {
      const status = error.code ?? 401;
      const message =
        status >= 500
          ? "Identity service is unavailable. Please try again shortly."
          : "Those credentials were not accepted.";

      return NextResponse.json(
        { ok: false, code: "credentials", message },
        { status: status >= 500 ? 502 : 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    console.error("[admin] login failed:", error);

    return NextResponse.json(
      {
        ok: false,
        code: "server_error",
        message: "Sign-in failed unexpectedly. Please try again.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
