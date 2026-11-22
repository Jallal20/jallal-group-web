import { NextResponse } from "next/server";

// Patch undici's fetch before node-appwrite loads it (Cloudflare Workers
// does not support the ALPNProtocols option that undici passes by default).
import "@/lib/undici-fetch-patch";

import { Client, Account, Users, AppwriteException, ID, Query } from "node-appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { adminTablesDB } from "@/lib/appwrite";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BootstrapBody = {
  bootstrapToken?: string;
  email?: string;
  password?: string;
  fullName?: string;
};

export async function POST(request: Request) {
  if (!isAppwriteConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        code: "not_configured",
        message: "Appwrite is not configured for this deployment.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const client = new Client()
    .setEndpoint(env.endpoint)
    .setProject(env.projectId)
    .setKey(env.apiKey);

  const account = new Account(client);
  const users = new Users(client);

  // Require the bootstrap token
  let body: BootstrapBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!env.bootstrapToken) {
    return NextResponse.json(
      {
        ok: false,
        code: "not_configured",
        message:
          "Super Admin bootstrap is not configured. Set ADMIN_BOOTSTRAP_TOKEN.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (body.bootstrapToken !== env.bootstrapToken) {
    return NextResponse.json(
      {
        ok: false,
        code: "forbidden",
        message: "Invalid bootstrap token.",
      },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const fullName = String(body.fullName ?? "Jallal Group Super Admin").trim();

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Email and password are required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Password must be at least 8 characters." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  // CRITICAL: disable bootstrap once ANY Super Admin exists.
  // A Super Admin is identified by the "admin" label or by ADMIN_EMAILS.
  try {
    // Global check: any existing user with the "admin" label disables bootstrap entirely.
    const allUsers = await users.list({
      queries: [Query.limit(100)],
      total: false,
    });
    if (allUsers.users.some((u) => u.labels?.includes("admin"))) {
      return NextResponse.json(
        {
          ok: false,
          code: "already_exists",
          message: "A Super Admin already exists. Bootstrap is disabled.",
        },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Unable to verify existing admins." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Per-email check: the specific email being bootstrapped already has admin.
  try {
    const existingLabelled = await users.list({
      queries: [Query.equal("email", email), Query.limit(1)],
      total: false,
    });
    if (existingLabelled.users.length > 0) {
      const existing = existingLabelled.users[0];
      if (existing.labels?.includes("admin")) {
        return NextResponse.json(
          {
            ok: false,
            code: "already_exists",
            message: "A Super Admin already exists. Bootstrap is disabled.",
          },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        );
      }
    }
  } catch {
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Unable to verify existing admins." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Also check ADMIN_EMAILS list — any listed email means bootstrap done.
  if (env.adminEmails.includes(email)) {
    return NextResponse.json(
      {
        ok: false,
        code: "already_exists",
        message: "A Super Admin already exists. Bootstrap is disabled.",
      },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let userId: string;
  try {
    const user = await account.create({
      userId: ID.unique(),
      email,
      password,
      name: fullName,
    });
    userId = user.$id;
  } catch (error) {
    if (error instanceof AppwriteException) {
      if (error.code === 409 || /already exists/i.test(error.message)) {
        return NextResponse.json(
          {
            ok: false,
            code: "already_exists",
            message: "An account with this email already exists.",
          },
          { status: 409, headers: { "Cache-Control": "no-store" } },
        );
      }
    }
    console.error("[bootstrap] account creation failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create account." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Apply the "admin" label (Super Admin). This is never assignable via UI.
  try {
    await users.updateLabels({ userId, labels: ["admin"] });
  } catch (error) {
    console.error("[bootstrap] failed to apply admin label:", error);
  }

  try {
    await writeAuditLog({
      adminId: userId,
      adminEmail: email,
      action: "bootstrap",
      module: "super-admin",
      recordId: userId,
      details: `Created initial Super Admin account "${fullName}" (${email}) via secure bootstrap.`,
    });
  } catch {
    // Audit failure must not block bootstrap completion.
  }

  return NextResponse.json(
    {
      ok: true,
      message: "Super Admin account created successfully. Bootstrap is now disabled.",
      adminId: userId,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
