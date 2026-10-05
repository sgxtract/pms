import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditUserForm } from "@/components/features/users/edit-user-form";
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
          roleLocked={user.id === actor.id}
        />
      </section>
    </div>
  );
}
