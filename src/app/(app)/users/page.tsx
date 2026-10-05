import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS, USER_TYPE_LABELS } from "@/lib/roles";
import { requirePermission } from "@/server/auth/authorize";
import { listUsers } from "@/server/queries/users";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { can, canManageUser } from "@/lib/permissions";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const viewer = await requirePermission("user.view");
  const users = await listUsers();
  const activeCount = users.filter((user) => user.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} active of {users.length} accounts. Accounts are
            disabled, never deleted.
          </p>
        </div>
        {can(viewer, "user.manage_regular") && (
          <Link href="/users/new" className={buttonClasses()}>
            Add user
          </Link>
        )}
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Employee ID</TableHeaderCell>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell>User type</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-mono">{user.employeeId}</TableCell>
              <TableCell>
                {canManageUser(viewer, user) ? (
                  <Link
                    href={`/users/${user.id}`}
                    className="font-medium text-link hover:underline"
                  >
                    {user.fullName}
                  </Link>
                ) : (
                  user.fullName
                )}
                {user.id === viewer.id && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (you)
                  </span>
                )}
              </TableCell>
              <TableCell>{ROLE_LABELS[user.role]}</TableCell>
              <TableCell>
                {user.userType ? (
                  USER_TYPE_LABELS[user.userType]
                ) : (
                  <>
                    <span aria-hidden className="text-muted-foreground">
                      —
                    </span>
                    <span className="sr-only">None</span>
                  </>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  {user.isActive ? (
                    <Badge tone="success">Active</Badge>
                  ) : (
                    <Badge>Disabled</Badge>
                  )}
                  {user.isActive && user.mustChangePassword && (
                    <Badge tone="warning">Temporary password</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                {formatDate(user.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
