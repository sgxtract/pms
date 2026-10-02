import type { Metadata } from "next";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Signed in as {user.fullName} ({user.role}).
      </p>
    </div>
  );
}
