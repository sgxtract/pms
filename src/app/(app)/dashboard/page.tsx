import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { can } from "@/lib/permissions";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Signed in as {user.fullName}.
        </p>
      </div>
      {can(user, "pr.create") && (
        <Link href="/requests/new" className={buttonClasses()}>
          New PR
        </Link>
      )}
    </div>
  );
}
