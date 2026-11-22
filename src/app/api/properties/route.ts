import { NextResponse } from "next/server";
import {
  BackendNotConfiguredError,
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = STATUSES.includes(searchParams.get("status") as PropertyStatus)
    ? (searchParams.get("status") as PropertyStatus)
    : undefined;
  const category = CATEGORIES.includes(searchParams.get("category") as PropertyCategory)
    ? (searchParams.get("category") as PropertyCategory)
    : undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const result = await listProperties({
      search: q,
      status,
      category,
      published: true,
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
    console.error("[public] properties list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Properties could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
