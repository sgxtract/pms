import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PrFilterBar } from "@/components/features/procurement/pr-filter-bar";
import { PrStatusBadge } from "@/components/features/procurement/pr-status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { TEXT_LINK } from "@/components/ui/link-styles";
import { Pagination } from "@/components/ui/pagination";
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

function StageBadge({ code, name }: { code: string; name: string }) {
  return (
    <Badge tone={code === "completed" ? "success" : "neutral"}>{name}</Badge>
  );
}

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
  const canCreate = can(user, "pr.create");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Requests</h1>
          <p className="mt-1 text-sm text-foreground/75">
            {result.total} {result.total === 1 ? "PR" : "PRs"}
            {isFiltered && " match these filters"}, total ABC{" "}
            <span className="tabular-nums">{formatPeso(result.totalAbc)}</span>
          </p>
        </div>
        {canCreate && (
          <Link
            href="/requests/new"
            className={buttonClasses({ variant: "ink", className: "gap-1.5" })}
          >
            <Plus className="size-4" aria-hidden />
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
        <div className="glass px-6 py-12 text-center">
          <p className="font-medium">
            {isFiltered ? "No PRs match these filters." : "No PRs yet."}
          </p>
          <p className="mt-2 text-sm">
            {isFiltered ? (
              <Link href="/requests" className={TEXT_LINK}>
                Clear all filters
              </Link>
            ) : (
              canCreate && (
                <Link href="/requests/new" className={TEXT_LINK}>
                  Create the first PR
                </Link>
              )
            )}
          </p>
        </div>
      ) : (
        <section
          aria-label="Purchase requests"
          className="glass overflow-hidden"
        >
          {/* Below lg: one stacked entry per PR instead of an 8-column table. */}
          <ul className="divide-y divide-foreground/10 lg:hidden">
            {result.rows.map((pr) => (
              <li
                key={pr.id}
                className="relative px-4 py-3.5 transition-colors hover:bg-foreground/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/requests/${pr.id}`}
                      className="font-mono font-medium outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
                    >
                      {pr.prNumber}
                    </Link>
                    {pr.referenceCode && (
                      <p className="font-mono text-xs text-muted-foreground">
                        {pr.referenceCode}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums">
                    {formatPeso(pr.abc)}
                  </p>
                </div>
                <p className="mt-1 line-clamp-2 text-sm">{pr.particulars}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pr.endUser} · {formatDate(pr.prDate)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StageBadge code={pr.stageCode} name={pr.stageName} />
                  {!(
                    pr.status === "active" && pr.stageCode === "completed"
                  ) && (
                    <PrStatusBadge
                      status={pr.status}
                      stageCode={pr.stageCode}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden lg:block">
            <Table framed={false}>
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
                        className={`font-mono ${TEXT_LINK}`}
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
                      <StageBadge code={pr.stageCode} name={pr.stageName} />
                    </TableCell>
                    <TableCell>
                      <PrStatusBadge
                        status={pr.status}
                        stageCode={pr.stageCode}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="border-t border-foreground/10 px-4 py-3">
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              pageSize={PR_PAGE_SIZE}
              hrefForPage={(page) =>
                `/requests${prFiltersToQuery(filters, { page })}`
              }
            />
          </div>
        </section>
      )}
    </div>
  );
}
