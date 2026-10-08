import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import {
  PR_PAGE_SIZE,
  prFiltersToQuery,
  type PrFilters,
} from "@/lib/pr-filters";

function PageLink({
  filters,
  page,
  disabled,
  children,
}: {
  filters: PrFilters;
  page: number;
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
    <Link
      href={`/requests${prFiltersToQuery(filters, { page })}`}
      className={classes}
    >
      {children}
    </Link>
  );
}

export function PrPagination({
  filters,
  page,
  pageCount,
  total,
}: {
  filters: PrFilters;
  page: number;
  pageCount: number;
  total: number;
}) {
  if (total === 0) return null;

  const start = (page - 1) * PR_PAGE_SIZE + 1;
  const end = Math.min(page * PR_PAGE_SIZE, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <p className="text-muted-foreground tabular-nums">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <PageLink filters={filters} page={page - 1} disabled={page <= 1}>
          Previous
        </PageLink>
        <span className="text-muted-foreground tabular-nums">
          Page {page} of {pageCount}
        </span>
        <PageLink
          filters={filters}
          page={page + 1}
          disabled={page >= pageCount}
        >
          Next
        </PageLink>
      </div>
    </nav>
  );
}
