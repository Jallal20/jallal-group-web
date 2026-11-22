import { NextResponse } from "next/server";

// Patch undici's fetch before node-appwrite loads it (Cloudflare Workers
// does not support the ALPNProtocols option that undici passes by default).
import "@/lib/undici-fetch-patch";

import { cookies } from "next/headers";
import { Account, Client } from "node-appwrite";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth";
import { env, isAppwriteConfigured } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const store = await cookies();
  const secret = store.get(ADMIN_SESSION_COOKIE)?.value;

  if (secret && isAppwriteConfigured()) {
    try {
      const client = new Client()
        .setEndpoint(env.endpoint)
        .setProject(env.projectId)
        .setSession(secret);

      await new Account(client).deleteSession({ sessionId: "current" });
    } catch {
      // Session may already be expired — clearing the cookie is enough.
    }
  }

  store.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json(
    { ok: true, message: "Signed out." },
    { headers: { "Cache-Control": "no-store" } },
  );
}
