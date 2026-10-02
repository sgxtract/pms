"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { passwordSchema } from "@/lib/validation/password";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { getCurrentSession } from "@/server/auth/session";
import { sql } from "@/server/db";
import { getRequestMeta } from "@/server/request-meta";

export type ChangePasswordState = { error: string } | undefined;

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Enter your current password.")
      .max(128, "Password is too long."),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "The new passwords don't match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Choose a password different from your current one.",
    path: ["newPassword"],
  });

export async function changePassword(
  _previousState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { currentPassword, newPassword } = parsed.data;

  const [user] = await sql`
    SELECT password_hash FROM users WHERE id = ${session.user.id}
  `;

  if (!(await verifyPassword(user.passwordHash, currentPassword))) {
    return { error: "Your current password is incorrect." };
  }

  const newPasswordHash = await hashPassword(newPassword);
  const meta = await getRequestMeta();
  const auditChanges = JSON.stringify({
    mustChangePassword: { from: session.user.mustChangePassword, to: false },
    otherSessionsSignedOut: true,
  });

  // One statement: update the password, sign out other sessions,
  // and write the audit entry, all or nothing.
  await sql`
    WITH updated AS (
      UPDATE users
      SET password_hash = ${newPasswordHash},
          must_change_password = false,
          updated_by = ${session.user.id}
      WHERE id = ${session.user.id}
      RETURNING id
    ),
    revoked AS (
      DELETE FROM sessions
      WHERE user_id = ${session.user.id} AND id <> ${session.id}
    )
    INSERT INTO audit_logs
      (actor_id, actor_role, action, entity_type, entity_id, changes, ip_address, user_agent)
    SELECT id, ${session.user.role}, 'user.password_change', 'user', id::text,
           ${auditChanges}::jsonb, ${meta.ipAddress}, ${meta.userAgent}
    FROM updated
  `;

  redirect("/dashboard");
}
