"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

type Option = { value: string; label: string };

export function InquiryFilters({
  statusOptions,
  typeOptions,
}: {
  statusOptions: Option[];
  typeOptions: Option[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debounced = useRef<NodeJS.Timeout | null>(null);

  const status = searchParams.get("status") ?? "all";
  const type = searchParams.get("type") ?? "all";

  function apply(params: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value && value !== "all") next.set(key, value);
      else next.delete(key);
    }
    router.replace(`/admin/inquiries?${next.toString()}`);
  }

  useEffect(() => {
    if (debounced.current) clearTimeout(debounced.current);
    debounced.current = setTimeout(() => {
      if ((searchParams.get("q") ?? "") !== search) {
        apply({ q: search });
      }
    }, 350);
    return () => {
      if (debounced.current) clearTimeout(debounced.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col gap-3 border-b border-line px-6 py-4 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, organisation, email or message…"
          aria-label="Search inquiries"
          className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3.5 text-body-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2">
          <span className="sr-only">Status</span>
          <select
            value={status}
            onChange={(event) => apply({ status: event.target.value })}
            className="h-10 rounded-md border border-line bg-white px-3 text-body-sm text-ink outline-none transition-colors focus:border-accent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="sr-only">Partnership type</span>
          <select
            value={type}
            onChange={(event) => apply({ type: event.target.value })}
            className="h-10 rounded-md border border-line bg-white px-3 text-body-sm text-ink outline-none transition-colors focus:border-accent"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
