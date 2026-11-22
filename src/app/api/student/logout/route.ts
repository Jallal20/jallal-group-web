import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logoutStudent, STUDENT_SESSION_COOKIE } from "@/lib/student-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  await logoutStudent();

  cookieStore.set(STUDENT_SESSION_COOKIE, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
