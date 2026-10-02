import type { Metadata } from "next";
import Link from "next/link";
import { ChangePasswordForm } from "@/components/features/auth/change-password-form";
import { IdleTimeoutWatcher } from "@/components/features/auth/idle-timeout-watcher";
import { logout } from "@/server/actions/auth";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const user = await requireUser({ allowPasswordChangeRequired: true });
  const isRequired = user.mustChangePassword;

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">
          {isRequired ? "Choose a new password" : "Change password"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRequired
            ? "Your account was set up with a temporary password. Choose your own password to continue."
            : "Enter your current password, then choose a new one."}
        </p>

        <ChangePasswordForm />

        <div className="mt-6 flex items-center justify-between text-sm">
          {isRequired ? (
            <span />
          ) : (
            <Link href="/dashboard" className="text-link hover:underline">
              Back to dashboard
            </Link>
          )}
          <form action={logout}>
            <button type="submit" className="text-link hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </div>

      <IdleTimeoutWatcher />
    </main>
  );
}
