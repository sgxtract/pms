import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/features/auth/login-form";
import { IDLE_TIMEOUT_SECONDS } from "@/lib/auth-config";
import { getCurrentSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string | string[] }>;
}) {
  const session = await getCurrentSession();
  if (session) redirect("/dashboard");

  const { reason } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Procurement Monitoring System
        </p>

        {reason === "timeout" && (
          <p
            role="status"
            className="mt-6 rounded-md bg-info-soft px-3 py-2 text-sm text-info-soft-foreground"
          >
            You were signed out after {IDLE_TIMEOUT_SECONDS / 60} minutes of
            inactivity. Sign in again to continue.
          </p>
        )}

        <LoginForm />

        <p className="mt-8 text-sm text-muted-foreground">
          Accounts are created by the system administrator. Contact them if you
          need access or have forgotten your password.
        </p>
      </div>
    </main>
  );
}
