import "server-only";

import { cache } from "react";
import { Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isContentStoreConfigured } from "@/lib/env";
import { companies as staticCompanies } from "@/content/companies";
import { ventures as staticVentures } from "@/content/ventures";
import type { Company, Venture } from "@/lib/types";

/**
 * Content data layer.
 *
 * Company and venture records live in Appwrite when the deployment is
 * configured, so copy can be updated from the Appwrite console without a code
 * release. When the backend is absent (local development, first run), the
 * structured records in `src/content` are served instead — the site never
 * pretends a backend is connected.
 */

type ContentRow = Models.Row & {
  slug: string;
  name: string;
  order: number;
  payload: string;
};

export type ContentSource = "appwrite" | "static" | "fallback";

export type ContentResult<T> = { items: T[]; source: ContentSource };

function parseRows<T>(rows: ContentRow[], key: (item: T) => string): T[] {
  const items: T[] = [];

  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.payload) as T;
      if (parsed && typeof parsed === "object") items.push(parsed);
    } catch {
      console.warn(`[content] skipping malformed row ${row.slug}`);
    }
  }

  return items.sort((a, b) => key(a).localeCompare(key(b)));
}

async function readContent<T>(
  tableId: string,
  fallback: T[],
  key: (item: T) => string,
): Promise<ContentResult<T>> {
  if (!isContentStoreConfigured() || !tableId) {
    return { items: fallback, source: "static" };
  }

  try {
    const result = await adminTablesDB().listRows<ContentRow>({
      databaseId: env.databaseId,
      tableId,
      queries: [Query.orderAsc("order"), Query.limit(100)],
    });

    if (result.rows.length === 0) {
      return { items: fallback, source: "static" };
    }

    const items = parseRows<T>(result.rows, key);
    return { items: items.length > 0 ? items : fallback, source: "appwrite" };
  } catch (error) {
    console.warn("[content] falling back to static records:", error);
    return { items: fallback, source: "fallback" };
  }
}

export const getCompanies = cache(
  async (): Promise<ContentResult<Company>> =>
    readContent<Company>(
      env.companiesCollectionId,
      staticCompanies,
      (item) => item.slug,
    ),
);

export const getVentures = cache(
  async (): Promise<ContentResult<Venture>> =>
    readContent<Venture>(
      env.venturesCollectionId,
      staticVentures,
      (item) => item.slug,
    ),
);

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const { items } = await getCompanies();
  return items.find((item) => item.slug === slug) ?? null;
}

export async function getVentureBySlug(slug: string): Promise<Venture | null> {
  const { items } = await getVentures();
  return items.find((item) => item.slug === slug) ?? null;
}
