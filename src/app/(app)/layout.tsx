import Link from "next/link";
import { IdleTimeoutWatcher } from "@/components/features/auth/idle-timeout-watcher";
import { NavLink } from "@/components/features/app-shell/nav-link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { can, type Permission } from "@/lib/permissions";
import { describeAccess } from "@/lib/roles";
import { logout } from "@/server/actions/auth";
import { requireUser } from "@/server/auth/session";

const NAV_ITEMS: { href: string; label: string; permission?: Permission }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/requests", label: "Requests", permission: "pr.view" },
  { href: "/users", label: "Users", permission: "user.view" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const navItems = NAV_ITEMS.filter(
    (item) => !item.permission || can(user, item.permission),
  );

  return (
    <div className="min-h-svh">
      <header className="border-b bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
          <Link href="/dashboard" className="font-heading font-semibold">
            PMS
          </Link>

          <nav
            aria-label="Main"
            className="order-last -mx-3 flex w-full gap-1 overflow-x-auto sm:order-0 sm:mx-0 sm:w-auto"
          >
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {describeAccess(user)}
              </p>
            </div>
            <ThemeToggle />
            <Link
              href="/change-password"
              className="rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Password
            </Link>
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
