import type { Metadata } from "next";
import { CreateUserForm } from "@/components/features/users/create-user-form";
import { BackLink } from "@/components/ui/back-link";
import { assignableRoles } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/authorize";

export const metadata: Metadata = { title: "Add user" };

const FIRST_SIGN_IN = [
  "The system generates a temporary password when you create the account.",
  "You give the Employee ID and temporary password to the person directly.",
  "At their first sign-in, they must choose their own password.",
];

export default async function NewUserPage() {
  const actor = await requirePermission("user.manage_regular");

  return (
    <div className="space-y-6">
      <BackLink href="/users">All users</BackLink>

      <div>
        <h1 className="text-2xl font-semibold">Add user</h1>
        <p className="mt-1 max-w-prose text-sm text-foreground/75">
          Accounts can be disabled later, but never deleted.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,32rem)_18rem] lg:items-start">
        <CreateUserForm roleOptions={assignableRoles(actor)} />

        <aside aria-labelledby="first-sign-in-heading" className="glass p-5">
          <h2 id="first-sign-in-heading" className="font-semibold">
            How the first sign-in works
          </h2>
          <ol className="mt-4 space-y-3 text-sm">
            {FIRST_SIGN_IN.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span
                  aria-hidden
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground/8 text-xs font-semibold tabular-nums"
                >
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
