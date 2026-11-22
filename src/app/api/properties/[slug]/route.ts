import { NextResponse } from "next/server";
import {
  BackendNotConfiguredError,
  getPropertyBySlug,
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

type Params = { slug: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;

  try {
    const property = await getPropertyBySlug(slug);
    if (!property) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Property not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ ok: true, property }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[public] property get failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Property could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
