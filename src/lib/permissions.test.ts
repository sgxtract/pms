import { describe, expect, it } from "vitest";
import {
  assignableRoles,
  auditScope,
  can,
  canManageUser,
  type Permission,
  type Subject,
} from "@/lib/permissions";

const SUBJECTS = {
  admin: { role: "admin", userType: null },
  moderator: { role: "moderator", userType: null },
  secretariat: { role: "user", userType: "secretariat" },
  twg: { role: "user", userType: "twg" },
  member: { role: "user", userType: "member" },
} satisfies Record<string, Subject>;

type SubjectName = keyof typeof SUBJECTS;
const ALL: SubjectName[] = [
  "admin",
  "moderator",
  "secretariat",
  "twg",
  "member",
];

// The permission matrix from the decisions log, section 3.2.
// Each permission lists exactly who is allowed.
const MATRIX: Record<Permission, SubjectName[]> = {
  "pr.view": ALL,
  "pr.create": ["admin", "moderator", "secretariat"],
  "pr.update": ["admin", "moderator", "secretariat", "twg"],
  "pr.move_stage": ["admin", "moderator", "secretariat", "twg"],
  "pr.cancel_restore": ["admin", "moderator", "secretariat", "twg"],
  "attachment.upload": ["admin", "moderator", "secretariat", "twg"],
  "attachment.delete_any": ["admin", "moderator"],
  "report.view": ALL,
  "user.view": ["admin", "moderator"],
  "user.manage_regular": ["admin", "moderator"],
  "user.manage_privileged": ["admin"],
};

const cases = Object.entries(MATRIX).flatMap(([permission, allowed]) =>
  ALL.map((name) => ({
    permission: permission as Permission,
    name,
    expected: allowed.includes(name),
  })),
);

describe("can()", () => {
  it.each(cases)(
    "$name → $permission is $expected",
    ({ permission, name, expected }) => {
      expect(can(SUBJECTS[name], permission)).toBe(expected);
    },
  );

  it("denies everything to a regular user without a user type", () => {
    const broken: Subject = { role: "user", userType: null };
    for (const permission of Object.keys(MATRIX) as Permission[]) {
      expect(can(broken, permission)).toBe(false);
    }
  });
});

describe("canManageUser()", () => {
  it("lets an Admin manage every role", () => {
    expect(canManageUser(SUBJECTS.admin, { role: "admin" })).toBe(true);
    expect(canManageUser(SUBJECTS.admin, { role: "moderator" })).toBe(true);
    expect(canManageUser(SUBJECTS.admin, { role: "user" })).toBe(true);
  });

  it("lets a Moderator manage only regular users", () => {
    expect(canManageUser(SUBJECTS.moderator, { role: "user" })).toBe(true);
    expect(canManageUser(SUBJECTS.moderator, { role: "moderator" })).toBe(
      false,
    );
    expect(canManageUser(SUBJECTS.moderator, { role: "admin" })).toBe(false);
  });

  it("lets no regular user manage accounts", () => {
    for (const name of ["secretariat", "twg", "member"] as const) {
      expect(canManageUser(SUBJECTS[name], { role: "user" })).toBe(false);
    }
  });
});

describe("assignableRoles()", () => {
  it("matches each role's authority", () => {
    expect(assignableRoles(SUBJECTS.admin)).toEqual([
      "admin",
      "moderator",
      "user",
    ]);
    expect(assignableRoles(SUBJECTS.moderator)).toEqual(["user"]);
    expect(assignableRoles(SUBJECTS.secretariat)).toEqual([]);
  });
});

describe("auditScope()", () => {
  it("follows the audit visibility rules", () => {
    expect(auditScope(SUBJECTS.admin)).toBe("all");
    expect(auditScope(SUBJECTS.moderator)).toBe("all_except_admin");
    expect(auditScope(SUBJECTS.twg)).toBe("own");
  });
});
