import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const classes = buttonClasses({ variant: "secondary", size: "sm" });
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={`${classes} pointer-events-none opacity-50`}
      >
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  hrefForPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  hrefForPage: (page: number) => string;
}) {
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <p className="text-muted-foreground tabular-nums">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <PageLink href={hrefForPage(page - 1)} disabled={page <= 1}>
          Previous
        </PageLink>
        <span className="text-muted-foreground tabular-nums">
          Page {page} of {pageCount}
        </span>
        <PageLink href={hrefForPage(page + 1)} disabled={page >= pageCount}>
          Next
        </PageLink>
      </div>
    </nav>
  );
}
