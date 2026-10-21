import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { TEXT_LINK } from "@/components/ui/link-styles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { can, canManageUser, visibleUserRoles } from "@/lib/permissions";
import { ROLE_LABELS, USER_TYPE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { requirePermission } from "@/server/auth/authorize";
import { listUsers, type UserListItem } from "@/server/queries/users";

export const metadata: Metadata = { title: "Users" };

function StatusBadges({ user }: { user: UserListItem }) {
  return (
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
  );
}

function YouMarker() {
  return <span className="ml-2 text-xs text-muted-foreground">(you)</span>;
}

export default async function UsersPage() {
  const viewer = await requirePermission("user.view");
  const users = await listUsers(visibleUserRoles(viewer));
  const activeCount = users.filter((user) => user.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-foreground/75">
            {activeCount} active of {users.length} accounts. Accounts are
            disabled, never deleted.
          </p>
        </div>
        {can(viewer, "user.manage_regular") && (
          <Link
            href="/users/new"
            className={buttonClasses({ variant: "ink", className: "gap-1.5" })}
          >
            <UserPlus className="size-4" aria-hidden />
            Add user
          </Link>
        )}
      </div>

      <section aria-label="User accounts" className="glass overflow-hidden">
        {/* Below lg: one stacked entry per account instead of a 6-column table. */}
        <ul className="divide-y divide-foreground/10 lg:hidden">
          {users.map((user) => {
            const canOpen = canManageUser(viewer, user);
            return (
              <li
                key={user.id}
                className={cn(
                  "relative px-4 py-3.5",
                  canOpen && "transition-colors hover:bg-foreground/5",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {canOpen ? (
                        <Link
                          href={`/users/${user.id}`}
                          className="outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
                        >
                          {user.fullName}
                        </Link>
                      ) : (
                        user.fullName
                      )}
                      {user.id === viewer.id && <YouMarker />}
                    </p>
                    <p className="text-sm">
                      {ROLE_LABELS[user.role]}
                      {user.userType && `, ${USER_TYPE_LABELS[user.userType]}`}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-xs text-muted-foreground">
                    {user.employeeId}
                  </p>
                </div>
                <div className="mt-2">
                  <StatusBadges user={user} />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="hidden lg:block">
          <Table framed={false}>
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
                      <Link href={`/users/${user.id}`} className={TEXT_LINK}>
                        {user.fullName}
                      </Link>
                    ) : (
                      user.fullName
                    )}
                    {user.id === viewer.id && <YouMarker />}
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
                    <StatusBadges user={user} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                    {formatDate(user.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
