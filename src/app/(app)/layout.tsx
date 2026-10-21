import {
  ChartColumn,
  FileText,
  History,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { MobileNav } from "@/components/features/app-shell/mobile-nav";
import {
  SidebarNav,
  type NavGroup,
  type NavItem,
} from "@/components/features/app-shell/sidebar-nav";
import { UserMenu } from "@/components/features/app-shell/user-menu";
import { IdleTimeoutWatcher } from "@/components/features/auth/idle-timeout-watcher";
import { Seal } from "@/components/features/brand/seal";
import { can, type Permission } from "@/lib/permissions";
import { describeAccess } from "@/lib/roles";
import { SITE } from "@/lib/site-config";
import { requireUser } from "@/server/auth/session";
import { GlassScene } from "@/components/features/app-shell/glass-scene";

type NavConfig = {
  label: string;
  items: (NavItem & { permission?: Permission })[];
}[];

const NAV: NavConfig = [
  {
    label: "Procurement",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard aria-hidden />,
      },
      {
        href: "/requests",
        label: "Requests",
        icon: <FileText aria-hidden />,
        permission: "pr.view",
      },
      {
        href: "/reports",
        label: "Reports",
        icon: <ChartColumn aria-hidden />,
        permission: "report.view",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        href: "/users",
        label: "Users",
        icon: <Users aria-hidden />,
        permission: "user.view",
      },
      { href: "/audit-log", label: "Audit log", icon: <History aria-hidden /> },
      {
        href: "/settings",
        label: "Settings",
        icon: <Settings aria-hidden />,
        permission: "settings.manage",
      },
    ],
  },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
      <Seal size={compact ? 28 : 36} eager />
      <span className="min-w-0 leading-tight">
        <span className="block font-heading font-semibold">PMS</span>
        {!compact && (
          <span className="block text-xs text-muted-foreground">
            {SITE.lguName}
          </span>
        )}
      </span>
    </Link>
  );
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const roleLabel = describeAccess(user);

  // Each group keeps only the links this user may open; empty groups are dropped.
  const groups: NavGroup[] = NAV.map((group) => ({
    label: group.label,
    items: group.items.filter(
      (item) => !item.permission || can(user, item.permission),
    ),
  })).filter((group) => group.items.length > 0);

  const navigation = <SidebarNav groups={groups} />;

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[16.5rem_1fr] print:block">
      <GlassScene />
      <div className="sticky top-0 hidden h-svh p-3 lg:block print:hidden">
        <aside className="glass flex h-full flex-col glass-strong">
          <div className="border-b border-foreground/10 px-4 py-4">
            <Brand />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">{navigation}</div>
          <div className="border-t border-foreground/10 p-3">
            <UserMenu
              name={user.fullName}
              roleLabel={roleLabel}
              placement="up"
            />
          </div>
        </aside>
      </div>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b bg-surface px-3 py-2 lg:hidden print:hidden">
          <MobileNav>{navigation}</MobileNav>
          <Brand compact />
          <div className="ml-auto">
            <UserMenu
              name={user.fullName}
              roleLabel={roleLabel}
              placement="down"
            />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:max-w-none print:p-0">
          {children}
        </main>
      </div>

      <IdleTimeoutWatcher />
    </div>
  );
}
