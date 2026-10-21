import type { Metadata } from "next";
import Link from "next/link";
import { GlassScene } from "@/components/features/app-shell/glass-scene";
import { ChangePasswordForm } from "@/components/features/auth/change-password-form";
import { IdleTimeoutWatcher } from "@/components/features/auth/idle-timeout-watcher";
import { Seal } from "@/components/features/brand/seal";
import { TEXT_LINK } from "@/components/ui/link-styles";
import { SITE } from "@/lib/site-config";
import { logout } from "@/server/actions/auth";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const user = await requireUser({ allowPasswordChangeRequired: true });
  const isRequired = user.mustChangePassword;

  return (
    <main className="relative grid min-h-svh place-items-center px-4 py-12">
      <GlassScene />

      <div className="glass w-full max-w-md glass-strong p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <Seal size={40} eager />
          <div className="leading-tight">
            <p className="text-xs text-muted-foreground">{SITE.lguName}</p>
            <p className="font-heading font-semibold">{SITE.systemName}</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold">
          {isRequired ? "Choose a new password" : "Change password"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRequired
            ? "Your account was set up with a temporary password. Choose your own password to continue."
            : "Enter your current password, then choose a new one."}
        </p>

        <ChangePasswordForm />

        <div className="mt-6 flex items-center justify-between border-t border-foreground/10 pt-5 text-sm">
          {isRequired ? (
            <span />
          ) : (
            <Link href="/dashboard" className={TEXT_LINK}>
              Back to dashboard
            </Link>
          )}
          <form action={logout}>
            <button type="submit" className={TEXT_LINK}>
              Sign out
            </button>
          </form>
        </div>
      </div>

      <IdleTimeoutWatcher />
    </main>
  );
}
