import { NextResponse } from "next/server";
import {
  BackendNotConfiguredError,
  createInquiry,
} from "@/lib/inquiries";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  formatZodErrors,
  partnershipInquirySchema,
} from "@/lib/validation";
import { site } from "@/content/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUCCESS_MESSAGE =
  "Thank you. Your inquiry has been received. Our business development team will respond within two business days.";

export async function POST(request: Request) {
  const ip = clientKey(request);
  const limited = rateLimit(`inquiry:${ip}`, { max: 6 });

  if (!limited.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: "rate_limited",
        message: "Too many submissions. Please wait a moment and try again.",
        retryAfterSeconds: limited.retryAfterSeconds,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const payload = body as Record<string, unknown>;

  // Honeypot: bots fill the hidden "website" field. Pretend success so the
  // automation gains nothing, but store nothing.
  if (typeof payload.website === "string" && payload.website.trim() !== "") {
    return NextResponse.json(
      { ok: true, message: SUCCESS_MESSAGE },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = partnershipInquirySchema.safeParse({
    fullName: payload.fullName,
    organization: payload.organization,
    email: payload.email,
    phone: payload.phone,
    partnershipType: payload.partnershipType,
    message: payload.message,
    website: payload.website ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "validation",
        message: "Please correct the highlighted fields.",
        errors: formatZodErrors(parsed.error),
      },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await createInquiry(parsed.data, {
      ip,
      userAgent: request.headers.get("user-agent"),
      source: typeof payload.source === "string" ? payload.source : "website",
    });

    return NextResponse.json(
      {
        ok: true,
        message: SUCCESS_MESSAGE,
        reference: result.id,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        {
          ok: false,
          code: "not_configured",
          message: `The inquiry service is not configured on this deployment yet. Please email ${site.email} directly.`,
          email: site.email,
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    console.error("[inquiries] create failed:", error);

    return NextResponse.json(
      {
        ok: false,
        code: "server_error",
        message:
          "We could not record your inquiry right now. Please try again shortly or email us directly.",
        email: site.email,
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
