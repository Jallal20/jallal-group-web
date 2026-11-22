import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createStudentSession, STUDENT_SESSION_COOKIE, STUDENT_SESSION_MAX_AGE } from "@/lib/student-auth";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "validation", message: parsed.error.flatten().fieldErrors },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const session = await createStudentSession(parsed.data.email, parsed.data.password);
    const cookieStore = await cookies();
    cookieStore.set(STUDENT_SESSION_COOKIE, session.session.secret, {
      path: "/",
      maxAge: STUDENT_SESSION_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { ok: false, code: "invalid_credentials", message: "Invalid email or password." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Login failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
