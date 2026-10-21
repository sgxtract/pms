import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountStatusPanel } from "@/components/features/users/account-status-panel";
import { EditUserForm } from "@/components/features/users/edit-user-form";
import { ResetPasswordPanel } from "@/components/features/users/reset-password-panel";
import { BackLink } from "@/components/ui/back-link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { assignableRoles, canManageUser } from "@/lib/permissions";
import { describeAccess } from "@/lib/roles";
import { requirePermission } from "@/server/auth/authorize";
import { getUserById } from "@/server/queries/users";

export const metadata: Metadata = { title: "Edit user" };

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requirePermission("user.manage_regular");
  const { id } = await params;

  const user = await getUserById(id);
  if (!user || !canManageUser(actor, user)) notFound();

  const isSelf = user.id === actor.id;

  return (
    <div className="space-y-6">
      <BackLink href="/users">All users</BackLink>

      <header className="space-y-2">
        <p className="font-mono text-sm text-foreground/75">
          {user.employeeId}
        </p>
        <h1 className="text-2xl font-semibold">{user.fullName}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/75">
          {user.isActive ? (
            <Badge tone="success">Active</Badge>
          ) : (
            <Badge>Disabled</Badge>
          )}
          {user.isActive && user.mustChangePassword && (
            <Badge tone="warning">Temporary password</Badge>
          )}
          <span>
            {describeAccess(user)}, since {formatDate(user.createdAt)}
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section aria-labelledby="details-heading" className="glass p-5 sm:p-6">
          <h2 id="details-heading" className="text-lg font-semibold">
            Account details
          </h2>
          <div className="mt-5 max-w-md">
            <EditUserForm
              user={user}
              roleOptions={assignableRoles(actor)}
              roleLocked={isSelf}
            />
          </div>
        </section>

        {isSelf ? (
          <section aria-labelledby="own-account-heading" className="glass p-5">
            <h2 id="own-account-heading" className="font-semibold">
              Password and status
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              To change your own password, use Change password in your account
              menu. You can&apos;t disable your own account.
            </p>
          </section>
        ) : (
          <div className="glass divide-y divide-foreground/10">
            <section aria-labelledby="password-heading" className="p-5">
              <h2 id="password-heading" className="font-semibold">
                Password
              </h2>
              <div className="mt-3">
                <ResetPasswordPanel userId={user.id} fullName={user.fullName} />
              </div>
            </section>

            <section aria-labelledby="status-heading" className="p-5">
              <h2 id="status-heading" className="font-semibold">
                Account status
              </h2>
              <div className="mt-3">
                <AccountStatusPanel
                  userId={user.id}
                  fullName={user.fullName}
                  isActive={user.isActive}
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
