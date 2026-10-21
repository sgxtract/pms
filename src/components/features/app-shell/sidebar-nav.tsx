import { NavLink } from "@/components/features/app-shell/nav-link";

export type NavItem = { href: string; label: string; icon: React.ReactNode };
export type NavGroup = { label: string; items: NavItem[] };

export function SidebarNav({ groups }: { groups: NavGroup[] }) {
  return (
    <nav aria-label="Main" className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-2 text-xs font-medium text-muted-foreground">
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} icon={item.icon}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
