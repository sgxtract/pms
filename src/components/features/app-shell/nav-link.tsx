"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium",
        "transition-colors duration-200 ease-glass",
        "text-foreground/80 hover:bg-foreground/5 hover:text-foreground",
        "aria-[current=page]:bg-ink aria-[current=page]:text-on-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "[&_svg]:size-4 [&_svg]:shrink-0",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
