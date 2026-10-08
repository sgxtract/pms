"use server";

import { revalidatePath } from "next/cache";
import { assignableRoles, canManageUser } from "@/lib/permissions";
import { userDetailsSchema } from "@/lib/validation/user";
import { diffFields, writeAuditLog } from "@/server/audit";
import { hashPassword } from "@/server/auth/password";
import type { SessionUser } from "@/server/auth/session";
import { generateTemporaryPassword } from "@/server/auth/temporary-password";
import { isUniqueViolation, transaction, type Db } from "@/server/db";
import { getRequestMeta } from "@/server/request-meta";
import type { Role, UserType } from "@/lib/roles";
import { getActionUser } from "@/server/auth/authorize";

export type CreateUserState =
  | { status: "error"; message: string }
  | {
      status: "created";
      employeeId: string;
      fullName: string;
      temporaryPassword: string;
    }
  | undefined;

export type UpdateUserState =
  { status: "error"; message: string } | { status: "saved" } | undefined;

const DUPLICATE_EMPLOYEE_ID = "Another account already uses this Employee ID.";

type AccountRow = {
  id: string;
  employeeId: string;
  fullName: string;
  role: Role;
  userType: UserType | null;
  isActive: boolean;
  mustChangePassword: boolean;
};

// The signed-in user, if they may manage accounts at all.
async function getAccountManager(): Promise<SessionUser | null> {
  return getActionUser("user.manage_regular");
}

function parseUserDetails(formData: FormData) {
  return userDetailsSchema.safeParse({
    employeeId: String(formData.get("employeeId") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    role: formData.get("role"),
    userType: formData.get("userType") || null,
  });
}

// Locks every active Admin row until the transaction ends, then counts the
// ones other than `userId`. Locking stops two simultaneous changes from
// each removing "the other" Admin.
async function countOtherActiveAdmins(tx: Db, userId: string): Promise<number> {
  const admins = await tx`
    SELECT id FROM users
    WHERE role = 'admin' AND is_active
    ORDER BY id
    FOR UPDATE
  `;
  return admins.filter((admin) => admin.id !== userId).length;
}

async function lockAccount(
  tx: Db,
  userId: string,
): Promise<AccountRow | undefined> {
  if (!/^\d+$/.test(userId)) return undefined;

  const [account] = await tx<AccountRow[]>`
    SELECT id, employee_id, full_name, role, user_type,
           is_active, must_change_password
    FROM users
    WHERE id = ${userId}
    FOR UPDATE
  `;
  return account;
}

export async function createUser(
  _previousState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const actor = await getAccountManager();
  if (!actor) {
    return {
      status: "error",
      message: "You don't have permission to create accounts.",
    };
  }

  const parsed = parseUserDetails(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }
  const details = parsed.data;

  if (!assignableRoles(actor).includes(details.role)) {
    return {
      status: "error",
      message: "You can't create an account with that role.",
    };
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const meta = await getRequestMeta();

  try {
    await transaction(async (tx) => {
      const [created] = await tx`
        INSERT INTO users
          (employee_id, full_name, role, user_type, password_hash,
           must_change_password, created_by, updated_by)
        VALUES
          (${details.employeeId}, ${details.fullName}, ${details.role},
           ${details.userType}, ${passwordHash}, true, ${actor.id}, ${actor.id})
        RETURNING id
      `;

      await writeAuditLog(
        {
          actor: { id: actor.id, role: actor.role },
          action: "user.create",
          entityType: "user",
          entityId: created.id,
          changes: {
            employeeId: details.employeeId,
            fullName: details.fullName,
            role: details.role,
            userType: details.userType,
          },
          meta,
        },
        tx,
      );
    });
  } catch (error) {
    if (isUniqueViolation(error, "users_employee_id_key")) {
      return { status: "error", message: DUPLICATE_EMPLOYEE_ID };
    }
    throw error;
  }

  revalidatePath("/users");
  return {
    status: "created",
    employeeId: details.employeeId,
    fullName: details.fullName,
    temporaryPassword,
  };
}

export async function updateUser(
  _previousState: UpdateUserState,
  formData: FormData,
): Promise<UpdateUserState> {
  const actor = await getAccountManager();
  if (!actor) {
    return {
      status: "error",
      message: "You don't have permission to edit accounts.",
    };
  }

  const userId = String(formData.get("userId") ?? "");
  const parsed = parseUserDetails(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }
  const details = parsed.data;
  const meta = await getRequestMeta();

  let result: UpdateUserState;
  try {
    result = await transaction(async (tx): Promise<UpdateUserState> => {
      // Lock order matters: Admins first, then the target. Every
      // transaction locking in the same order can never deadlock.
      const otherAdmins = await countOtherActiveAdmins(tx, userId);
      const target = await lockAccount(tx, userId);

      if (!target || !canManageUser(actor, target)) {
        return { status: "error", message: "You can't edit this account." };
      }
      if (!assignableRoles(actor).includes(details.role)) {
        return {
          status: "error",
          message: "You can't give an account that role.",
        };
      }
      if (target.id === actor.id && details.role !== target.role) {
        return { status: "error", message: "You can't change your own role." };
      }
      if (
        target.role === "admin" &&
        target.isActive &&
        details.role !== "admin" &&
        otherAdmins === 0
      ) {
        return {
          status: "error",
          message:
            "This is the last active Administrator. Make another account an Administrator first.",
        };
      }

      const before = {
        employeeId: target.employeeId,
        fullName: target.fullName,
        role: target.role,
        userType: target.userType,
      };
      const changes = diffFields(before, details, [
        "employeeId",
        "fullName",
        "role",
        "userType",
      ]);
      if (Object.keys(changes).length === 0) return { status: "saved" };

      await tx`
        UPDATE users
        SET employee_id = ${details.employeeId},
            full_name = ${details.fullName},
            role = ${details.role},
            user_type = ${details.userType},
            updated_by = ${actor.id}
        WHERE id = ${target.id}
      `;

      await writeAuditLog(
        {
          actor: { id: actor.id, role: actor.role },
          action: "user.update",
          entityType: "user",
          entityId: target.id,
          changes,
          meta,
        },
        tx,
      );

      return { status: "saved" };
    });
  } catch (error) {
    if (isUniqueViolation(error, "users_employee_id_key")) {
      return { status: "error", message: DUPLICATE_EMPLOYEE_ID };
    }
    throw error;
  }

  if (result?.status === "saved") {
    revalidatePath("/users");
    revalidatePath(`/users/${userId}`);
  }
  return result;
}

export type ResetPasswordState =
  | { status: "error"; message: string }
  | {
      status: "reset";
      employeeId: string;
      fullName: string;
      temporaryPassword: string;
    }
  | undefined;

export async function resetUserPassword(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const actor = await getAccountManager();
  if (!actor) {
    return {
      status: "error",
      message: "You don't have permission to reset passwords.",
    };
  }

  const userId = String(formData.get("userId") ?? "");

  // Hash before the transaction, so rows stay locked only briefly.
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const meta = await getRequestMeta();

  const result = await transaction(async (tx): Promise<ResetPasswordState> => {
    const target = await lockAccount(tx, userId);

    if (!target || !canManageUser(actor, target)) {
      return {
        status: "error",
        message: "You can't reset this account's password.",
      };
    }
    if (target.id === actor.id) {
      return {
        status: "error",
        message: "Use the Password page to change your own password.",
      };
    }

    await tx`
      UPDATE users
      SET password_hash = ${passwordHash},
          must_change_password = true,
          updated_by = ${actor.id}
      WHERE id = ${target.id}
    `;
    await tx`DELETE FROM sessions WHERE user_id = ${target.id}`;

    await writeAuditLog(
      {
        actor: { id: actor.id, role: actor.role },
        action: "user.password_reset",
        entityType: "user",
        entityId: target.id,
        changes: {
          mustChangePassword: { from: target.mustChangePassword, to: true },
          sessionsSignedOut: true,
        },
        meta,
      },
      tx,
    );

    return {
      status: "reset",
      employeeId: target.employeeId,
      fullName: target.fullName,
      temporaryPassword,
    };
  });

  if (result?.status === "reset") {
    revalidatePath("/users");
    revalidatePath(`/users/${userId}`);
  }
  return result;
}

export type AccountStatusState =
  | { status: "error"; message: string }
  | { status: "updated"; isActive: boolean }
  | undefined;

export async function setAccountActive(
  _previousState: AccountStatusState,
  formData: FormData,
): Promise<AccountStatusState> {
  const actor = await getAccountManager();
  if (!actor) {
    return {
      status: "error",
      message: "You don't have permission to change account status.",
    };
  }

  const userId = String(formData.get("userId") ?? "");
  const makeActive = formData.get("active") === "true";
  const meta = await getRequestMeta();

  const result = await transaction(async (tx): Promise<AccountStatusState> => {
    // Same lock order as updateUser: Admins first, then the target.
    const otherAdmins = await countOtherActiveAdmins(tx, userId);
    const target = await lockAccount(tx, userId);

    if (!target || !canManageUser(actor, target)) {
      return {
        status: "error",
        message: "You can't change this account's status.",
      };
    }
    if (target.id === actor.id) {
      return {
        status: "error",
        message: "You can't disable or enable your own account.",
      };
    }
    if (target.isActive === makeActive) {
      return { status: "updated", isActive: makeActive };
    }
    if (!makeActive && target.role === "admin" && otherAdmins === 0) {
      return {
        status: "error",
        message: "This is the last active Administrator and can't be disabled.",
      };
    }

    await tx`
      UPDATE users
      SET is_active = ${makeActive}, updated_by = ${actor.id}
      WHERE id = ${target.id}
    `;

    // Without this, re-enabling the account would revive old sessions.
    if (!makeActive) {
      await tx`DELETE FROM sessions WHERE user_id = ${target.id}`;
    }

    await writeAuditLog(
      {
        actor: { id: actor.id, role: actor.role },
        action: makeActive ? "user.enable" : "user.disable",
        entityType: "user",
        entityId: target.id,
        changes: {
          isActive: { from: target.isActive, to: makeActive },
          ...(makeActive ? {} : { sessionsSignedOut: true }),
        },
        meta,
      },
      tx,
    );

    return { status: "updated", isActive: makeActive };
  });

  if (result?.status === "updated") {
    revalidatePath("/users");
    revalidatePath(`/users/${userId}`);
  }
  return result;
}
