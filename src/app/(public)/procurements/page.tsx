import type { Metadata } from "next";
import Link from "next/link";
import { PrStatusBadge } from "@/components/features/procurement/pr-status-badge";
import { PublicFilterBar } from "@/components/features/public/public-filter-bar";
import { Badge } from "@/components/ui/badge";
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
import {
  PUBLIC_PAGE_SIZE,
  hasActivePublicFilters,
  parsePublicPrFilters,
  publicPrFiltersToQuery,
} from "@/lib/public-pr-filters";
import type { SearchParams } from "@/lib/search-params";
import { SITE } from "@/lib/site-config";
import { getPublicFilterOptions, listPublicPrs } from "@/server/queries/public";

export const metadata: Metadata = {
  title: "Public procurement",
  description: `Procurement requests of the ${SITE.lguName} and their current status.`,
};

export default async function PublicProcurementPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parsePublicPrFilters(await searchParams);
  const [result, options] = await Promise.all([
    listPublicPrs(filters),
    getPublicFilterOptions(),
  ]);
  const isFiltered = hasActivePublicFilters(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Public procurement</h1>
        <p className="mt-1 max-w-prose text-sm text-foreground/75">
          Procurement requests of the {SITE.lguName}, with their current stage
          and status.
        </p>
        <p className="mt-2 text-sm text-foreground/75">
          {result.total} {result.total === 1 ? "PR" : "PRs"}
          {isFiltered && " match your search"}, total ABC{" "}
          <span className="tabular-nums">{formatPeso(result.totalAbc)}</span>
        </p>
      </div>

      <PublicFilterBar
        key={publicPrFiltersToQuery(filters, { page: 1 })}
        filters={filters}
        options={options}
      />

      {result.total === 0 ? (
        <div className="glass px-6 py-12 text-center">
          <p className="font-medium">
            {isFiltered
              ? "No PRs match your search."
              : "No procurement requests yet."}
          </p>
          {isFiltered && (
            <p className="mt-2 text-sm">
              <Link href="/procurements" className={TEXT_LINK}>
                Clear the search
              </Link>
            </p>
          )}
        </div>
      ) : (
        <section
          aria-label="Procurement requests"
          className="glass overflow-hidden"
        >
          {/* Below lg: one stacked entry per PR instead of an 8-column table. */}
          <ul className="divide-y divide-foreground/10 lg:hidden">
            {result.rows.map((pr) => (
              <li key={pr.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono font-medium">{pr.prNumber}</p>
                  <p className="shrink-0 text-sm font-medium tabular-nums">
                    {formatPeso(pr.abc)}
                  </p>
                </div>
                <p className="mt-1 line-clamp-2 text-sm">{pr.particulars}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pr.endUser}, {formatDate(pr.prDate)}
                  {pr.procurementMode && `, ${pr.procurementMode}`}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge>{pr.stageName}</Badge>
                  <PrStatusBadge status={pr.status} stageCode={pr.stageCode} />
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
                    <TableCell className="font-mono whitespace-nowrap">
                      {pr.prNumber}
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
                      <Badge>{pr.stageName}</Badge>
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
              pageSize={PUBLIC_PAGE_SIZE}
              hrefForPage={(page) =>
                `/procurements${publicPrFiltersToQuery(filters, { page })}`
              }
            />
          </div>
        </section>
      )}
    </div>
  );
}
