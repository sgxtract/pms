export const ROLES = ["admin", "moderator", "user"] as const;
export type Role = (typeof ROLES)[number];

export const USER_TYPES = ["secretariat", "twg", "member"] as const;
export type UserType = (typeof USER_TYPES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  moderator: "Moderator",
  user: "User",
};

export const USER_TYPE_LABELS: Record<UserType, string> = {
  secretariat: "PBAC Secretariat",
  twg: "PBAC TWG",
  member: "PBAC Member",
};

// The single label that best describes someone's access,
// e.g. "Administrator" or "PBAC TWG".
export function describeAccess(subject: {
  role: Role;
  userType: UserType | null;
}): string {
  if (subject.role === "user" && subject.userType) {
    return USER_TYPE_LABELS[subject.userType];
  }
  return ROLE_LABELS[subject.role];
}
