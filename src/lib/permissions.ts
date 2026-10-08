import type { Role, UserType } from "@/lib/roles";

export type Permission =
  | "pr.view"
  | "pr.create"
  | "pr.update"
  | "pr.move_stage"
  | "pr.cancel_restore"
  | "attachment.upload"
  | "attachment.delete_any"
  | "report.view"
  | "user.view"
  | "user.manage_regular"
  | "user.manage_privileged";

export type Subject = { role: Role; userType: UserType | null };

const EVERYONE: Permission[] = ["pr.view", "report.view"];

const PR_WORK: Permission[] = [
  "pr.update",
  "pr.move_stage",
  "pr.cancel_restore",
  "attachment.upload",
];

// Decisions log, section 3.2: Admin and Moderator
const ROLE_PERMISSIONS: Record<Exclude<Role, "user">, readonly Permission[]> = {
  admin: [
    ...EVERYONE,
    "pr.create",
    ...PR_WORK,
    "attachment.delete_any",
    "user.view",
    "user.manage_regular",
    "user.manage_privileged",
  ],
  moderator: [
    ...EVERYONE,
    "pr.create",
    ...PR_WORK,
    "attachment.delete_any",
    "user.view",
    "user.manage_regular",
  ],
};

// Decisions log, section 3.2: regular Users, by User Type
const USER_TYPE_PERMISSIONS: Record<UserType, readonly Permission[]> = {
  secretariat: [...EVERYONE, "pr.create", ...PR_WORK],
  twg: [...EVERYONE, ...PR_WORK],
  member: [...EVERYONE],
};

export function can(subject: Subject, permission: Permission): boolean {
  if (subject.role !== "user") {
    return ROLE_PERMISSIONS[subject.role].includes(permission);
  }
  if (!subject.userType) return false;
  return USER_TYPE_PERMISSIONS[subject.userType].includes(permission);
}

// Whether `actor` may edit, reset, or disable `target`'s account.
export function canManageUser(actor: Subject, target: { role: Role }): boolean {
  if (actor.role === "admin") return true;
  if (actor.role === "moderator") return target.role === "user";
  return false;
}

// Which roles `actor` may give to an account.
export function assignableRoles(actor: Subject): Role[] {
  if (actor.role === "admin") return ["admin", "moderator", "user"];
  if (actor.role === "moderator") return ["user"];
  return [];
}

// Which accounts, by role, `viewer` may see in the users list.
export function visibleUserRoles(viewer: Subject): Role[] {
  if (viewer.role === "admin") return ["admin", "moderator", "user"];
  if (viewer.role === "moderator") return ["moderator", "user"];
  return [];
}

export type AuditScope = "all" | "all_except_admin" | "own";

// Decisions log, section 3.2: audit log visibility
export function auditScope(subject: Subject): AuditScope {
  if (subject.role === "admin") return "all";
  if (subject.role === "moderator") return "all_except_admin";
  return "own";
}
