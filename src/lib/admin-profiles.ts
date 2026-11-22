import "server-only";

import {
  ID,
  Query,
  Users,
  AppwriteException,
  type Models,
} from "node-appwrite";
import { adminClient, adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

type AdminProfileRow = Models.Row & {
  adminId: string;
  email: string;
  fullName: string;
  phone: string;
  assignedCompany: string;
  role: string;
  status: string;
  permissions: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

function toAdminProfile(row: AdminProfileRow) {
  return {
    id: row.$id,
    adminId: row.adminId,
    email: row.email,
    fullName: row.fullName,
    phone: row.phone,
    assignedCompany: row.assignedCompany,
    role: row.role,
    status: row.status,
    permissions: JSON.parse(row.permissions ?? "[]"),
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.siteSettingsId; // reuse site settings table for admin profiles if needed
const ADMIN_PROFILES_TABLE_ID = "admin_profiles";

export type AdminProfileFilters = {
  search?: string;
  status?: string;
  role?: string;
  limit?: number;
};

export type AdminProfileInput = {
  adminId: string;
  email: string;
  fullName: string;
  phone: string;
  assignedCompany: string;
  role: string;
  status: string;
  permissions: string[];
  createdBy: string;
  /** Optional temporary password. If omitted, a random one is generated. */
  password?: string;
};

export type AdminProfileResult = ReturnType<typeof toAdminProfile> & {
  temporaryPassword?: string;
};

export async function listAdminProfiles(
  filters: AdminProfileFilters = {},
): Promise<{ items: ReturnType<typeof toAdminProfile>[]; total: number }> {
  requireBackend();

  const db = adminTablesDB();
  const queries: string[] = [];

  if (filters.status) {
    queries.push(Query.equal("status", filters.status));
  }
  if (filters.role) {
    queries.push(Query.equal("role", filters.role));
  }

  queries.push(Query.orderDesc("$createdAt"));
  queries.push(Query.limit(Math.min(filters.limit ?? 50, 200)));

  const result = await db.listRows<AdminProfileRow>({
    databaseId: env.databaseId,
    tableId: ADMIN_PROFILES_TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toAdminProfile);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getAdminProfile(id: string) {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<AdminProfileRow>({
      databaseId: env.databaseId,
      tableId: ADMIN_PROFILES_TABLE_ID,
      rowId: id,
    });
    return toAdminProfile(row);
  } catch {
    return null;
  }
}

export async function getAdminProfileByEmail(email: string) {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<AdminProfileRow>({
      databaseId: env.databaseId,
      tableId: ADMIN_PROFILES_TABLE_ID,
      queries: [Query.equal("email", email), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toAdminProfile(result.rows[0]);
  } catch {
    return null;
  }
}

export async function createAdminProfile(
  input: AdminProfileInput,
  admin?: { id: string; email: string },
): Promise<AdminProfileResult> {
  requireBackend();

  const temporaryPassword =
    input.password ??
    Math.random().toString(36).slice(-10) + "Aa1!";

  const users = new Users(adminClient());

  // Provision the actual Appwrite Auth account so the administrator can log in.
  // Super Admin status ("admin" label) can never be assigned through this path.
  try {
    const existingUsers = await users.list({
      queries: [Query.equal("email", input.email), Query.limit(1)],
      total: false,
    });
    if (existingUsers.users.length > 0) {
      throw new Error(
        `An Appwrite account with email "${input.email}" already exists.`,
      );
    }
    await users.create({
      userId: input.adminId,
      email: input.email,
      password: temporaryPassword,
      name: input.fullName,
    });
    // Apply the chosen role as an Appwrite label (never "admin").
    await users.updateLabels({
      userId: input.adminId,
      labels: [input.role],
    });
  } catch (error) {
    if (error instanceof AppwriteException) {
      throw error;
    }
    throw error;
  }

  const db = adminTablesDB();

  const existing = await getAdminProfileByEmail(input.email);
  if (existing) {
    throw new Error(`An administrator with email "${input.email}" already exists.`);
  }

  const row = await db.createRow<AdminProfileRow>({
    databaseId: env.databaseId,
    tableId: ADMIN_PROFILES_TABLE_ID,
    rowId: ID.unique(),
    data: {
      adminId: input.adminId,
      email: input.email,
      fullName: input.fullName,
      phone: input.phone,
      assignedCompany: input.assignedCompany,
      role: input.role,
      status: input.status,
      permissions: JSON.stringify(input.permissions),
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  const profile = toAdminProfile(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "admin-profiles",
      recordId: profile.id,
      details: `Created administrator profile "${profile.fullName}" (${profile.email})`,
    });
  }

  return { ...profile, temporaryPassword };
}

export async function updateAdminProfile(
  id: string,
  input: Partial<AdminProfileInput>,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const existing = await getAdminProfile(id);
  if (!existing) {
    throw new Error(`Administrator profile with id "${id}" not found.`);
  }

  if (input.email && input.email !== existing.email) {
    const existingByEmail = await getAdminProfileByEmail(input.email);
    if (existingByEmail) {
      throw new Error(`An administrator with email "${input.email}" already exists.`);
    }
  }

  const row = await adminTablesDB().updateRow<AdminProfileRow>({
    databaseId: env.databaseId,
    tableId: ADMIN_PROFILES_TABLE_ID,
    rowId: id,
    data: {
      ...(input.email !== undefined && { email: input.email }),
      ...(input.fullName !== undefined && { fullName: input.fullName }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.assignedCompany !== undefined && {
        assignedCompany: input.assignedCompany,
      }),
      ...(input.role !== undefined && { role: input.role }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.permissions !== undefined && {
        permissions: JSON.stringify(input.permissions),
      }),
    },
  });

  const profile = toAdminProfile(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "admin-profiles",
      recordId: id,
      details: `Updated administrator profile "${profile.fullName}"`,
    });
  }

  return profile;
}

export async function deleteAdminProfile(
  id: string,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const existing = await getAdminProfile(id);
  if (!existing) {
    throw new Error(`Administrator profile with id "${id}" not found.`);
  }

  await adminTablesDB().deleteRow({
    databaseId: env.databaseId,
    tableId: ADMIN_PROFILES_TABLE_ID,
    rowId: id,
  });

  if (admin && existing) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "delete",
      module: "admin-profiles",
      recordId: id,
      details: `Deleted administrator profile "${existing.fullName}"`,
    });
  }
}
