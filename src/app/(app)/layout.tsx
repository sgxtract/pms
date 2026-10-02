import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { logout } from "@/server/actions/auth";
import { requireUser } from "@/server/auth/session";
import { IdleTimeoutWatcher } from "@/components/features/auth/idle-timeout-watcher";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-svh">
      <header className="border-b bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="font-heading font-semibold">PMS</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user.fullName}
            </span>
            <ThemeToggle />
            <form action={logout}>
              <Button type="submit" variant="secondary" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <IdleTimeoutWatcher />
    </div>
  );
}
