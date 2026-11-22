import "server-only";

import { ID, Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";
import type {
  Property,
  PropertyCategory,
  PropertyStatus,
} from "@/lib/types";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

type PropertyRow = Models.Row & {
  title: string;
  slug: string;
  category: PropertyCategory;
  propertyType: string;
  description: string;
  location: string;
  district: string;
  community: string;
  price: number;
  currency: string;
  size: string;
  status: PropertyStatus;
  imageIds: string[];
  videoUrl: string;
  featured: boolean;
  projectDesignation: string;
  contactInfo: string;
  published: boolean;
};

function toProperty(row: PropertyRow): Property {
  return {
    id: row.$id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    propertyType: row.propertyType,
    description: row.description,
    location: row.location,
    district: row.district,
    community: row.community,
    price: row.price,
    currency: row.currency,
    size: row.size,
    status: row.status,
    imageIds: row.imageIds,
    videoUrl: row.videoUrl,
    featured: row.featured,
    projectDesignation: row.projectDesignation,
    contactInfo: row.contactInfo,
    published: row.published,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.propertiesId;

export type PropertyFilters = {
  search?: string;
  status?: PropertyStatus;
  category?: PropertyCategory;
  published?: boolean;
  limit?: number;
};

export async function listProperties(
  filters: PropertyFilters = {},
): Promise<{ items: Property[]; total: number }> {
  requireBackend();

  const db = adminTablesDB();
  const queries: string[] = [];

  if (filters.status) {
    queries.push(Query.equal("status", filters.status));
  }
  if (filters.category) {
    queries.push(Query.equal("category", filters.category));
  }
  if (filters.published !== undefined) {
    queries.push(Query.equal("published", filters.published));
  }

  queries.push(Query.orderDesc("$createdAt"));
  queries.push(Query.limit(Math.min(filters.limit ?? 50, 200)));

  const result = await db.listRows<PropertyRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toProperty);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.community.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getProperty(id: string): Promise<Property | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<PropertyRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toProperty(row);
  } catch {
    return null;
  }
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<PropertyRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("slug", slug), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toProperty(result.rows[0]);
  } catch {
    return null;
  }
}

export type PropertyInput = {
  title: string;
  slug: string;
  category: PropertyCategory;
  propertyType: string;
  description: string;
  location: string;
  district: string;
  community: string;
  price: number;
  currency: string;
  size: string;
  status: PropertyStatus;
  imageIds: string[];
  videoUrl: string;
  featured: boolean;
  projectDesignation: string;
  contactInfo: string;
  published: boolean;
};

export async function createProperty(
  input: PropertyInput,
  admin?: { id: string; email: string },
): Promise<Property> {
  requireBackend();

  const db = adminTablesDB();

  // Ensure slug uniqueness
  const existing = await getPropertyBySlug(input.slug);
  if (existing) {
    throw new Error(`A property with slug "${input.slug}" already exists.`);
  }

  const row = await db.createRow<PropertyRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      title: input.title,
      slug: input.slug,
      category: input.category,
      propertyType: input.propertyType,
      description: input.description,
      location: input.location,
      district: input.district,
      community: input.community,
      price: input.price,
      currency: input.currency,
      size: input.size,
      status: input.status,
      imageIds: input.imageIds,
      videoUrl: input.videoUrl,
      featured: input.featured,
      projectDesignation: input.projectDesignation,
      contactInfo: input.contactInfo,
      published: input.published,
    },
  });

  const property = toProperty(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "properties",
      recordId: property.id,
      details: `Created property "${property.title}"`,
    });
  }

  return property;
}

export async function updateProperty(
  id: string,
  input: Partial<PropertyInput>,
  admin?: { id: string; email: string },
): Promise<Property> {
  requireBackend();

  const existing = await getProperty(id);
  if (!existing) {
    throw new Error(`Property with id "${id}" not found.`);
  }

  // If slug is changing, check uniqueness
  if (input.slug && input.slug !== existing.slug) {
    const existingBySlug = await getPropertyBySlug(input.slug);
    if (existingBySlug) {
      throw new Error(`A property with slug "${input.slug}" already exists.`);
    }
  }

  const row = await adminTablesDB().updateRow<PropertyRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.propertyType !== undefined && { propertyType: input.propertyType }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.district !== undefined && { district: input.district }),
      ...(input.community !== undefined && { community: input.community }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.size !== undefined && { size: input.size }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.imageIds !== undefined && { imageIds: input.imageIds }),
      ...(input.videoUrl !== undefined && { videoUrl: input.videoUrl }),
      ...(input.featured !== undefined && { featured: input.featured }),
      ...(input.projectDesignation !== undefined && {
        projectDesignation: input.projectDesignation,
      }),
      ...(input.contactInfo !== undefined && { contactInfo: input.contactInfo }),
      ...(input.published !== undefined && { published: input.published }),
    },
  });

  const property = toProperty(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "properties",
      recordId: id,
      details: `Updated property "${property.title}"`,
    });
  }

  return property;
}

export async function deleteProperty(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getProperty(id);
  if (!existing) {
    throw new Error(`Property with id "${id}" not found.`);
  }

  await adminTablesDB().deleteRow({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
  });

  if (admin && existing) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "delete",
      module: "properties",
      recordId: id,
      details: `Deleted property "${existing.title}"`,
    });
  }
}
