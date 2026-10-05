"use server";

import { revalidatePath } from "next/cache";
import { assignableRoles, can, canManageUser } from "@/lib/permissions";
import { userDetailsSchema } from "@/lib/validation/user";
import { diffFields, writeAuditLog } from "@/server/audit";
import { hashPassword } from "@/server/auth/password";
import { getCurrentSession, type SessionUser } from "@/server/auth/session";
import { generateTemporaryPassword } from "@/server/auth/temporary-password";
import { isUniqueViolation, transaction, type Db } from "@/server/db";
import { getRequestMeta } from "@/server/request-meta";
import type { Role, UserType } from "@/lib/roles";

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
};

// The signed-in user, if they may manage accounts at all.
async function getAccountManager(): Promise<SessionUser | null> {
  const session = await getCurrentSession();
  if (!session || session.user.mustChangePassword) return null;
  if (!can(session.user, "user.manage_regular")) return null;
  return session.user;
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

      const [target] = await tx<AccountRow[]>`
        SELECT id, employee_id, full_name, role, user_type, is_active
        FROM users
        WHERE id = ${/^\d+$/.test(userId) ? userId : null}
        FOR UPDATE
      `;

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
