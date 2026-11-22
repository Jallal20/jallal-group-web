import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { registerStudentAccount, createStudentSession, STUDENT_SESSION_COOKIE, STUDENT_SESSION_MAX_AGE } from "@/lib/student-auth";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  studentId: z.string().min(1),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional(),
  address: z.string().optional(),
  institution: z.string().optional(),
  educationalLevel: z.string().optional(),
  courseOfStudy: z.string().optional(),
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
    const { userId } = await registerStudentAccount({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
      studentId: parsed.data.studentId,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone ?? "",
      dateOfBirth: parsed.data.dateOfBirth ?? null,
      gender: parsed.data.gender ?? "",
      address: parsed.data.address ?? "",
      institution: parsed.data.institution ?? "",
      educationalLevel: parsed.data.educationalLevel ?? "",
      courseOfStudy: parsed.data.courseOfStudy ?? "",
    });

    const session = await createStudentSession(parsed.data.email, parsed.data.password);
    const cookieStore = await cookies();
    cookieStore.set(STUDENT_SESSION_COOKIE, session.session.secret, {
      path: "/",
      maxAge: STUDENT_SESSION_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({ ok: true, userId }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json(
          { ok: false, code: "exists", message: "An account with this email already exists." },
          { status: 409, headers: { "Cache-Control": "no-store" } },
        );
      }
      return NextResponse.json(
        { ok: false, code: "server_error", message: error.message },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Registration failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
