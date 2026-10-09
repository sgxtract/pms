import type { Metadata } from "next";
import Link from "next/link";
import { PrFilterBar } from "@/components/features/procurement/pr-filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatPeso } from "@/lib/format";
import { can } from "@/lib/permissions";
import {
  hasActiveFilters,
  parsePrFilters,
  prFiltersToQuery,
  PR_PAGE_SIZE,
} from "@/lib/pr-filters";
import { requirePermission } from "@/server/auth/authorize";
import { getPrFilterOptions, listPrs } from "@/server/queries/procurement";

export const metadata: Metadata = { title: "Requests" };

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("pr.view");
  const filters = parsePrFilters(await searchParams);
  const [result, options] = await Promise.all([
    listPrs(filters),
    getPrFilterOptions(),
  ]);
  const isFiltered = hasActiveFilters(filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.total} {result.total === 1 ? "PR" : "PRs"}
            {isFiltered && " match these filters"}, total ABC{" "}
            <span className="tabular-nums">{formatPeso(result.totalAbc)}</span>
          </p>
        </div>
        {can(user, "pr.create") && (
          <Link href="/requests/new" className={buttonClasses()}>
            New PR
          </Link>
        )}
      </div>

      <PrFilterBar
        key={prFiltersToQuery(filters, { page: 1 })}
        filters={filters}
        options={options}
      />

      {result.total === 0 ? (
        <div className="rounded-lg border bg-surface px-6 py-12 text-center">
          <p className="font-medium">
            {isFiltered ? "No PRs match these filters." : "No PRs yet."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFiltered ? (
              <Link href="/requests" className="text-link hover:underline">
                Clear all filters
              </Link>
            ) : (
              can(user, "pr.create") && (
                <Link
                  href="/requests/new"
                  className="text-link hover:underline"
                >
                  Create the first PR
                </Link>
              )
            )}
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>PR Number</TableHeaderCell>
                <TableHeaderCell>PR date</TableHeaderCell>
                <TableHeaderCell>Particulars</TableHeaderCell>
                <TableHeaderCell>End-User</TableHeaderCell>
                <TableHeaderCell className="text-right">ABC</TableHeaderCell>
                <TableHeaderCell>Mode</TableHeaderCell>
                <TableHeaderCell>Stage</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.rows.map((pr) => (
                <TableRow key={pr.id}>
                  <TableCell className="whitespace-nowrap">
                    <Link
                      href={`/requests/${pr.id}`}
                      className="font-mono font-medium text-link hover:underline"
                    >
                      {pr.prNumber}
                    </Link>
                    {pr.referenceCode && (
                      <p className="font-mono text-xs text-muted-foreground">
                        {pr.referenceCode}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatDate(pr.prDate)}
                  </TableCell>
                  <TableCell className="max-w-md min-w-56">
                    <p className="line-clamp-2" title={pr.particulars}>
                      {pr.particulars}
                    </p>
                  </TableCell>
                  <TableCell className="min-w-40">{pr.endUser}</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatPeso(pr.abc)}
                  </TableCell>
                  <TableCell className="min-w-32">
                    {pr.procurementMode ?? (
                      <span className="text-muted-foreground">
                        Not specified
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      tone={
                        pr.stageCode === "completed" ? "success" : "neutral"
                      }
                    >
                      {pr.stageName}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {pr.status === "cancelled" ? (
                      <Badge tone="danger">Cancelled</Badge>
                    ) : (
                      <Badge tone="info">Active</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={PR_PAGE_SIZE}
            hrefForPage={(page) =>
              `/requests${prFiltersToQuery(filters, { page })}`
            }
          />
        </>
      )}
    </div>
  );
}
