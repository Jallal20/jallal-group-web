import { NextResponse } from "next/server";
import { BackendNotConfiguredError, getCourseBySlug } from "@/lib/courses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;

  try {
    const course = await getCourseBySlug(slug);
    if (!course) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Course not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ ok: true, course }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[public] course get by slug failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Course could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
