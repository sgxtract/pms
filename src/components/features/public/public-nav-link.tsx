"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * A pill link in the public top bar. The current page gets a soft fill
 * rather than ink, so the page's own ink action stays the strongest thing.
 */
export function PublicNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className="rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap text-foreground/75 transition-colors duration-200 ease-glass hover:bg-foreground/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:bg-foreground/10 aria-[current=page]:text-foreground"
    >
      {children}
    </Link>
  );
}
