import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/student-auth";
import { listNotifications, getUnreadCount, markNotificationRead } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireStudent() {
  const student = await getCurrentStudent();
  if (!student) {
    return NextResponse.json(
      { ok: false, code: "unauthenticated", message: "You must be logged in." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { student };
}

export async function GET() {
  const authorised = await requireStudent();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const student = authorised.student;

  const [unreadCountResult, notificationsResult] = await Promise.all([
    getUnreadCount(student.id),
    listNotifications({ userId: student.id, limit: 50 }),
  ]);

  return NextResponse.json(
    { ok: true, items: notificationsResult.items, unreadCount: unreadCountResult },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  const authorised = await requireStudent();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "id is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await markNotificationRead(id);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[student] notification mark read failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to mark notification as read." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
