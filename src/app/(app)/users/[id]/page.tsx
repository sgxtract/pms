import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditUserForm } from "@/components/features/users/edit-user-form";
import { assignableRoles, canManageUser } from "@/lib/permissions";
import { describeAccess } from "@/lib/roles";
import { requirePermission } from "@/server/auth/authorize";
import { getUserById } from "@/server/queries/users";
import { AccountStatusPanel } from "@/components/features/users/account-status-panel";
import { ResetPasswordPanel } from "@/components/features/users/reset-password-panel";

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
    <div className="space-y-8">
      <div>
        <Link href="/users" className="text-sm text-link hover:underline">
          All users
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{user.fullName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-mono">{user.employeeId}</span>,{" "}
          {describeAccess(user)}
          {!user.isActive && ", disabled"}
        </p>
      </div>

      <section aria-labelledby="details-heading" className="space-y-4">
        <h2 id="details-heading" className="text-lg font-semibold">
          Account details
        </h2>
        <EditUserForm
          user={user}
          roleOptions={assignableRoles(actor)}
          roleLocked={isSelf}
        />
      </section>
      {isSelf ? (
        <section
          aria-labelledby="own-account-heading"
          className="space-y-2 border-t pt-8"
        >
          <h2 id="own-account-heading" className="text-lg font-semibold">
            Password and status
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            To change your own password, use Password in the header. You
            can&apos;t disable your own account.
          </p>
        </section>
      ) : (
        <>
          <section
            aria-labelledby="password-heading"
            className="space-y-3 border-t pt-8"
          >
            <h2 id="password-heading" className="text-lg font-semibold">
              Password
            </h2>
            <ResetPasswordPanel userId={user.id} fullName={user.fullName} />
          </section>

          <section
            aria-labelledby="status-heading"
            className="space-y-3 border-t pt-8"
          >
            <h2 id="status-heading" className="text-lg font-semibold">
              Account status
            </h2>
            <AccountStatusPanel
              userId={user.id}
              fullName={user.fullName}
              isActive={user.isActive}
            />
          </section>
        </>
      )}
    </div>
  );
}
