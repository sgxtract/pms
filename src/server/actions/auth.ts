"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { LOCKOUT_MINUTES, MAX_FAILED_LOGINS } from "@/lib/auth-config";
import { writeAuditLog } from "@/server/audit";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  createSession,
  deleteSessionCookie,
  getCurrentSession,
  invalidateSession,
  touchSession,
} from "@/server/auth/session";
import { sql } from "@/server/db";
import { getRequestMeta } from "@/server/request-meta";

export type LoginState = { error: string; employeeId: string } | undefined;

const loginSchema = z.object({
  employeeId: z
    .string()
    .trim()
    .min(1, "Enter your Employee ID.")
    .max(50, "Employee ID is too long.")
    .transform((value) => value.toUpperCase()),
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(128, "Password is too long."),
});

// Used when the Employee ID doesn't exist, so a wrong ID takes as long
// to reject as a wrong password. Otherwise response times would reveal
// which Employee IDs are real.
let dummyHash: Promise<string> | undefined;
function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword("timing-safety-placeholder");
  return dummyHash;
}

async function isLockedOut(employeeId: string): Promise<boolean> {
  const [row] = await sql`
    SELECT count(*)::int AS failures
    FROM audit_logs
    WHERE action = 'auth.login_failed'
      AND entity_type = 'auth'
      AND entity_id = ${employeeId}
      AND created_at > now() - make_interval(mins => ${LOCKOUT_MINUTES})
  `;
  return row.failures >= MAX_FAILED_LOGINS;
}

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const typedEmployeeId = String(formData.get("employeeId") ?? "");

  const parsed = loginSchema.safeParse({
    employeeId: formData.get("employeeId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0].message,
      employeeId: typedEmployeeId,
    };
  }

  const { employeeId, password } = parsed.data;
  const meta = await getRequestMeta();

  if (await isLockedOut(employeeId)) {
    return {
      error: `Too many failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`,
      employeeId: typedEmployeeId,
    };
  }

  const [user] = await sql`
    SELECT id, role, password_hash, is_active
    FROM users
    WHERE employee_id = ${employeeId}
  `;

  const passwordMatches = await verifyPassword(
    user?.passwordHash ?? (await getDummyHash()),
    password,
  );

  if (!user || !passwordMatches) {
    await writeAuditLog({
      actor: null,
      action: "auth.login_failed",
      entityType: "auth",
      entityId: employeeId,
      meta,
    });
    return {
      error: "Incorrect Employee ID or password.",
      employeeId: typedEmployeeId,
    };
  }

  if (!user.isActive) {
    await writeAuditLog({
      actor: null,
      action: "auth.login_blocked",
      entityType: "auth",
      entityId: employeeId,
      meta,
    });
    return {
      error: "This account is disabled. Contact your administrator.",
      employeeId: typedEmployeeId,
    };
  }

  await createSession(user.id, meta);
  await writeAuditLog({
    actor: { id: user.id, role: user.role },
    action: "auth.login",
    entityType: "auth",
    entityId: employeeId,
    meta,
  });

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const session = await getCurrentSession();

  if (session) {
    await invalidateSession(session.id);
    await writeAuditLog({
      actor: { id: session.user.id, role: session.user.role },
      action: "auth.logout",
      entityType: "auth",
      entityId: session.user.employeeId,
      meta: await getRequestMeta(),
    });
  }

  await deleteSessionCookie();
  redirect("/login");
}

export async function extendSession(): Promise<{ ok: boolean }> {
  const session = await getCurrentSession();
  if (!session) return { ok: false };

  await touchSession(session.id);
  return { ok: true };
}

export async function logoutDueToInactivity(): Promise<void> {
  const session = await getCurrentSession();

  if (session) {
    await invalidateSession(session.id);
    await writeAuditLog({
      actor: { id: session.user.id, role: session.user.role },
      action: "auth.timeout",
      entityType: "auth",
      entityId: session.user.employeeId,
      meta: await getRequestMeta(),
    });
  }

  await deleteSessionCookie();
}
