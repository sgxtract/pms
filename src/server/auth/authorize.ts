import "server-only";
import { notFound } from "next/navigation";
import { can, type Permission } from "@/lib/permissions";
import { requireUser, type SessionUser } from "@/server/auth/session";

export async function requirePermission(
  permission: Permission,
): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, permission)) notFound();
  return user;
}
