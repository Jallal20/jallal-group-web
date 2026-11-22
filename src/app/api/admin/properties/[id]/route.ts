import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  deleteProperty,
  getProperty,
  updateProperty,
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

type Params = { id: string };

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (body.category && !CATEGORIES.includes(body.category as PropertyCategory)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid property category." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (body.status && !STATUSES.includes(body.status as PropertyStatus)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid property status." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const existing = await getProperty(id);
    if (!existing) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Property not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const property = await updateProperty(id, {
      title: body.title !== undefined ? String(body.title).trim() : undefined,
      slug: body.slug !== undefined ? String(body.slug).trim() : undefined,
      category: body.category as PropertyCategory | undefined,
      propertyType: body.propertyType !== undefined ? String(body.propertyType).trim() : undefined,
      description: body.description !== undefined ? String(body.description).trim() : undefined,
      location: body.location !== undefined ? String(body.location).trim() : undefined,
      district: body.district !== undefined ? String(body.district).trim() : undefined,
      community: body.community !== undefined ? String(body.community).trim() : undefined,
      price: body.price !== undefined ? parseInt(String(body.price), 10) || 0 : undefined,
      currency: body.currency !== undefined ? String(body.currency).trim() : undefined,
      size: body.size !== undefined ? String(body.size).trim() : undefined,
      status: body.status as PropertyStatus | undefined,
      imageIds:
        body.imageIds !== undefined && Array.isArray(body.imageIds)
          ? body.imageIds
          : undefined,
      videoUrl: body.videoUrl !== undefined ? String(body.videoUrl).trim() : undefined,
      featured: body.featured !== undefined ? body.featured === true : undefined,
      projectDesignation: body.projectDesignation !== undefined ? String(body.projectDesignation).trim() : undefined,
      contactInfo: body.contactInfo !== undefined ? String(body.contactInfo).trim() : undefined,
      published: body.published !== undefined ? body.published === true : undefined,
    }, admin);

    return NextResponse.json({ ok: true, property }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] property update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to update property." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { id } = await params;

  try {
    const existing = await getProperty(id);
    if (!existing) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Property not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    await deleteProperty(id, admin);

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] property delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to delete property." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
