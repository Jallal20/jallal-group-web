import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  listProperties,
} from "@/lib/properties";
import {
  listEnrollments,
} from "@/lib/enrollments";
import {
  listInquiries,
} from "@/lib/inquiries";
import {
  listCourses,
} from "@/lib/courses";
import {
  listProjects as listElevate,
} from "@/lib/elevate-projects";
import {
  listProjects as listTech,
} from "@/lib/tech-projects";
import {
  listDigitalVentures,
} from "@/lib/digital-ventures";
import {
  listAdminProfiles,
} from "@/lib/admin-profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: Record<string, () => Promise<Array<Record<string, unknown>>>> = {
  properties: () =>
    listProperties({ limit: 1000 }).then((r) =>
      r.items as unknown as Record<string, unknown>[],
    ),
  enrollments: () =>
    listEnrollments({ limit: 1000 }).then((r) =>
      r.items as unknown as Record<string, unknown>[],
    ),
  inquiries: () =>
    listInquiries({ limit: 1000 }).then((r) =>
      r.items as unknown as Record<string, unknown>[],
    ),
  courses: () =>
    listCourses({ limit: 1000 }).then((r) =>
      r.items as unknown as Record<string, unknown>[],
    ),
  "elevate-projects": () =>
    listElevate({ limit: 1000 }).then((r) =>
      r.items as unknown as Record<string, unknown>[],
    ),
  "tech-projects": () =>
    listTech({ limit: 1000 }).then((r) =>
      r.items as unknown as Record<string, unknown>[],
    ),
  "digital-ventures": () =>
    listDigitalVentures({ limit: 1000 }).then((r) =>
      r.items as unknown as Record<string, unknown>[],
    ),
  "admin-profiles": () =>
    listAdminProfiles({ limit: 1000 }).then((r) =>
      r.items as unknown as Record<string, unknown>[],
    ),
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ report: string }> },
) {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "auditLogs.view")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to export reports." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { report } = await params;
  const reportName = String(report).replace(/\.csv$/i, "");
  const fetchRows = ALLOWED[report];
  if (!fetchRows) {
    return NextResponse.json(
      { ok: false, code: "not_found", message: "Unknown report." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  let rows: Array<Record<string, unknown>>;
  try {
    rows = await fetchRows();
  } catch (error) {
    console.error("[report] export failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Report could not be generated." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const csv = toCsv(rows);
  const filename = `${reportName}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines: string[] = [headers.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(","));
  }
  return lines.join("\n");
}
