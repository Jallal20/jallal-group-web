import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  deleteInquiry,
  updateInquiryStatus,
} from "@/lib/inquiries";
import type { InquiryStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

const STATUSES: InquiryStatus[] = ["pending", "reviewed", "responded"];

async function guard() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "Authentication required." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const unauthorized = await guard();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (!body.status || !STATUSES.includes(body.status as InquiryStatus)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid status value." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const inquiry = await updateInquiryStatus(
      id,
      body.status as InquiryStatus,
    );
    return NextResponse.json(
      { ok: true, inquiry },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        {
          ok: false,
          code: "not_configured",
          message: "Appwrite is not configured for this deployment.",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    console.error("[admin] status update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Update failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const unauthorized = await guard();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  try {
    await deleteInquiry(id);
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        {
          ok: false,
          code: "not_configured",
          message: "Appwrite is not configured for this deployment.",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    console.error("[admin] delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Delete failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
