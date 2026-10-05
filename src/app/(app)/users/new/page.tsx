import type { Metadata } from "next";
import Link from "next/link";
import { CreateUserForm } from "@/components/features/users/create-user-form";
import { assignableRoles } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/authorize";

export const metadata: Metadata = { title: "Add user" };

export default async function NewUserPage() {
  const actor = await requirePermission("user.manage_regular");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/users" className="text-sm text-link hover:underline">
          All users
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Add user</h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          The system generates a temporary password. The new user chooses their
          own password at first sign-in.
        </p>
      </div>
      <CreateUserForm roleOptions={assignableRoles(actor)} />
    </div>
  );
}
