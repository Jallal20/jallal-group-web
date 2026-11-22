import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Input, Select } from "@/components/ui/field";

export const metadata: Metadata = { title: "Audit Logs" };
export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; module?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const moduleFilter = (params.module ?? "").trim() || undefined;

  let items: Array<{
    id: string;
    adminId: string;
    adminEmail: string;
    action: string;
    module: string;
    recordId: string;
    timestamp: string;
    details: string;
  }> = [];
  let total = 0;
  let error: string | null = null;

  try {
    const response = await fetch(
      `/api/admin/audit-logs?q=${encodeURIComponent(q)}${
        moduleFilter ? `&module=${encodeURIComponent(moduleFilter)}` : ""
      }&limit=100`,
      { cache: "no-store" },
    );
    const payload = (await response.json()) as {
      ok?: boolean;
      items?: typeof items;
      total?: number;
    };
    if (payload.ok) {
      items = payload.items ?? [];
      total = payload.total ?? 0;
    } else {
      error = "Failed to load audit logs.";
    }
  } catch {
    error = "Audit logs could not be loaded right now.";
  }

  const modules = [...new Set(items.map((i) => i.module))];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">System</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Audit Logs
        </h1>
        <p className="text-body-md text-muted">
          Immutable record of administrative actions across the platform.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-5 text-body-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-2 md:flex-row md:items-center">
          <Input placeholder="Search by admin, action, module…" className="w-full md:w-96" />
          <Select className="w-full md:w-48">
            <option value="">All modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!error && items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="text-body-md text-ink">No audit log entries.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white shadow-card overflow-hidden">
          {items.map((log) => (
            <li key={log.id} className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-body-sm font-semibold text-ink truncate">
                  {log.adminEmail}
                </span>
                <span className="text-label-sm text-muted truncate">
                  {log.action} · {log.module}
                </span>
                <span className="text-label-sm text-muted">
                  {log.recordId ? `Record: ${log.recordId}` : ""}
                </span>
                <p className="text-body-sm leading-relaxed text-ink/80 mt-1">
                  {log.details}
                </p>
              </div>
              <div className="text-right">
                <span className="text-label-sm font-mono text-muted block">
                  {formatDate(log.timestamp)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between border-t border-line px-6 py-3 text-label-sm text-muted">
          <span>{total} entr{total === 1 ? "y" : "ies"} shown</span>
        </div>
      )}
    </div>
  );
}
