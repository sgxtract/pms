import "server-only";
import type { Role, UserType } from "@/lib/roles";
import { sql } from "@/server/db";

export type UserListItem = {
  id: string;
  employeeId: string;
  fullName: string;
  role: Role;
  userType: UserType | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
};

export async function listUsers(): Promise<UserListItem[]> {
  return sql<UserListItem[]>`
    SELECT id, employee_id, full_name, role, user_type,
           is_active, must_change_password, created_at
    FROM users
    ORDER BY is_active DESC, full_name
  `;
}
