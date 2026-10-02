import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  ABSOLUTE_LIFETIME_SECONDS,
  ACTIVITY_REFRESH_SECONDS,
  IDLE_TIMEOUT_SECONDS,
  SESSION_COOKIE_NAME,
} from "@/lib/auth-config";
import { sql } from "@/server/db";
import { env } from "@/server/env";
import type { RequestMeta } from "@/server/request-meta";
import type { Role, UserType } from "@/lib/roles";

export type SessionUser = {
  id: string;
  employeeId: string;
  fullName: string;
  role: Role;
  userType: UserType | null;
  mustChangePassword: boolean;
};

export type Session = {
  id: string;
  user: SessionUser;
};

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  meta: RequestMeta,
): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + ABSOLUTE_LIFETIME_SECONDS * 1000);

  // Housekeeping: remove sessions that have already expired.
  await sql`
    DELETE FROM sessions
    WHERE expires_at <= now()
       OR last_activity_at <= now() - make_interval(secs => ${IDLE_TIMEOUT_SECONDS})
  `;

  await sql`
    INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent)
    VALUES (${hashToken(token)}, ${userId}, ${expiresAt}, ${meta.ipAddress}, ${meta.userAgent})
  `;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export const getCurrentSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const sessionId = hashToken(token);

  const [row] = await sql`
    SELECT
      s.expires_at > now()
        AND s.last_activity_at > now() - make_interval(secs => ${IDLE_TIMEOUT_SECONDS})
        AND u.is_active AS is_valid,
      s.last_activity_at < now() - make_interval(secs => ${ACTIVITY_REFRESH_SECONDS})
        AS needs_refresh,
      u.id, u.employee_id, u.full_name, u.role, u.user_type, u.must_change_password
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ${sessionId}
  `;

  if (!row) return null;

  if (!row.isValid) {
    await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
    return null;
  }

  if (row.needsRefresh) {
    await sql`UPDATE sessions SET last_activity_at = now() WHERE id = ${sessionId}`;
  }

  return {
    id: sessionId,
    user: {
      id: row.id,
      employeeId: row.employeeId,
      fullName: row.fullName,
      role: row.role,
      userType: row.userType,
      mustChangePassword: row.mustChangePassword,
    },
  };
});

export async function requireUser(
  options: { allowPasswordChangeRequired?: boolean } = {},
): Promise<SessionUser> {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  if (session.user.mustChangePassword && !options.allowPasswordChangeRequired) {
    redirect("/change-password");
  }

  return session.user;
}

export async function touchSession(sessionId: string): Promise<void> {
  await sql`UPDATE sessions SET last_activity_at = now() WHERE id = ${sessionId}`;
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
}

export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
