import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionAccount } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { ADMIN_SESSION_COOKIE } from "@/lib/session";
import type {
  AdminPermission,
  AdminRole,
  AdminUser,
} from "@/lib/types";
import { ROLE_PERMISSIONS, MODULE_PERMISSIONS } from "@/lib/types";

export { ADMIN_SESSION_COOKIE };
export type { AdminPermission, AdminRole, AdminUser };

/**
 * Map an Appwrite account label to an AdminRole. Labels that don't correspond
 * to a known role are ignored (they carry no permissions).
 */
function labelToRole(label: string): AdminRole | null {
  const known: AdminRole[] = [
    "admin",
    "jallal-tech-admin",
    "jallal-institute-admin",
    "jallal-properties-admin",
    "elevate-360-admin",
    "content-editor",
    "program-administrator",
    "instructor",
  ];
  return known.includes(label as AdminRole) ? (label as AdminRole) : null;
}

/**
 * Resolve the roles and permissions for an account based on its labels. The
 * "admin" (super admin) role implies every permission.
 */
function resolveRolesAndPermissions(labels: string[]): {
  roles: AdminRole[];
  permissions: AdminPermission[];
  isSuperAdmin: boolean;
} {
  const roles = labels
    .map(labelToRole)
    .filter((role): role is AdminRole => role !== null);

  const isSuperAdmin = roles.includes("admin");

  const permissions = isSuperAdmin
    ? Object.values(ROLE_PERMISSIONS).flat()
    : Array.from(
        new Set(roles.flatMap((role) => ROLE_PERMISSIONS[role] ?? [])),
      );

  return { roles, permissions, isSuperAdmin };
}

export async function readSessionSecret(): Promise<string | null> {
  const store = await cookies();
  return store.get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

function hasAdminRole(user: {
  email: string;
  labels?: string[] | null;
}): boolean {
  if (user.labels?.includes("admin")) return true;
  return env.adminEmails.includes(user.email.toLowerCase());
}

/**
 * Validates the admin session cookie against Appwrite and confirms the
 * account carries admin authority. Returns null when not authenticated.
 *
 * This is the single source of truth for admin authorisation: every admin
 * route calls it server-side, so hiding links in the UI is never the control.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  if (!isAppwriteConfigured()) return null;

  const secret = await readSessionSecret();
  if (!secret) return null;

  try {
    const account = sessionAccount(secret);
    const user = await account.get();

    if (!hasAdminRole(user)) return null;

    const { roles, permissions, isSuperAdmin } = resolveRolesAndPermissions(
      user.labels ?? [],
    );

    return {
      id: user.$id,
      email: user.email,
      name: user.name || user.email,
      labels: user.labels ?? [],
      roles,
      permissions,
      isSuperAdmin,
    };
  } catch {
    return null;
  }
}

/** Server-side guard for every admin page and action. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/**
 * Returns true when the admin holds the given permission. Server-side only.
 */
export function hasPermission(
  admin: AdminUser,
  permission: AdminPermission,
): boolean {
  return admin.isSuperAdmin || admin.permissions.includes(permission);
}

/**
 * Server-side guard: redirects to login when unauthenticated, or to a
 * forbidden page when the admin lacks the required permission.
 */
export async function requirePermission(
  permission: AdminPermission,
): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (!hasPermission(admin, permission)) {
    redirect("/admin/forbidden");
  }
  return admin;
}

/**
 * Returns the subset of sidebar modules the admin is authorised to see.
 */
export function authorisedModules(admin: AdminUser): string[] {
  return Object.entries(MODULE_PERMISSIONS).filter(
    ([, permission]) => hasPermission(admin, permission),
  ).map(([module]) => module);
}
