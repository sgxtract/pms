import "server-only";
import { notFound } from "next/navigation";
import { can, type Permission } from "@/lib/permissions";
import {
  getCurrentSession,
  requireUser,
  type SessionUser,
} from "@/server/auth/session";

export async function requirePermission(
  permission: Permission,
): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, permission)) notFound();
  return user;
}

// For Server Actions: the signed-in user if they may perform `permission`,
// otherwise null. Actions return an error message rather than a 404.
export async function getActionUser(
  permission: Permission,
): Promise<SessionUser | null> {
  const session = await getCurrentSession();
  if (!session || session.user.mustChangePassword) return null;
  if (!can(session.user, permission)) return null;
  return session.user;
}
