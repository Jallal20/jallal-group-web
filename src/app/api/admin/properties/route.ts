import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createProperty,
  listProperties,
} from "@/lib/properties";
import type { PropertyCategory, PropertyStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: PropertyStatus[] = ["available", "sold", "rented", "off-market"];
const CATEGORIES: PropertyCategory[] = [
  "lands-for-sale",
  "residential-properties",
  "houses-for-sale",
  "houses-for-rent",
  "commercial-properties",
  "real-estate-development-projects",
  "upcoming-major-projects",
];

type Search = { q?: string; status?: string; category?: string; published?: string };

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "properties.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage properties." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { admin };
}

export async function GET(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = STATUSES.includes(searchParams.get("status") as PropertyStatus)
    ? (searchParams.get("status") as PropertyStatus)
    : undefined;
  const category = CATEGORIES.includes(searchParams.get("category") as PropertyCategory)
    ? (searchParams.get("category") as PropertyCategory)
    : undefined;
  const published = searchParams.get("published");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const result = await listProperties({
      search: q,
      status,
      category,
      published: published === "true" ? true : published === "false" ? false : undefined,
      limit,
    });
    return NextResponse.json({ ok: true, items: result.items, total: result.total });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] properties list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Properties could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Validate required fields
  const required = ["title", "slug", "category", "propertyType", "description", "location", "status"];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return NextResponse.json(
        { ok: false, code: "validation", message: `${field} is required.` },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  if (!CATEGORIES.includes(body.category as PropertyCategory)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid property category." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!STATUSES.includes(body.status as PropertyStatus)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid property status." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const property = await createProperty(
      {
        title: String(body.title).trim(),
        slug: String(body.slug).trim(),
        category: body.category as PropertyCategory,
        propertyType: String(body.propertyType).trim(),
        description: String(body.description).trim(),
        location: String(body.location).trim(),
        district: String(body.district ?? "").trim(),
        community: String(body.community ?? "").trim(),
        price: parseInt(String(body.price ?? "0"), 10) || 0,
        currency: String(body.currency ?? "SLE").trim(),
        size: String(body.size ?? "").trim(),
        status: body.status as PropertyStatus,
        imageIds: Array.isArray(body.imageIds) ? body.imageIds : [],
        videoUrl: String(body.videoUrl ?? "").trim(),
        featured: body.featured === true,
        projectDesignation: String(body.projectDesignation ?? "").trim(),
        contactInfo: String(body.contactInfo ?? "").trim(),
        published: body.published === true,
      },
      admin,
    );

    return NextResponse.json({ ok: true, property }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] property create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create property." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
