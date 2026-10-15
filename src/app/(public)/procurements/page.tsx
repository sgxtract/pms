import type { Metadata } from "next";
import { PrStatusBadge } from "@/components/features/procurement/pr-status-badge";
import { PublicFilterBar } from "@/components/features/public/public-filter-bar";
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
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Procurement requests of the {SITE.lguName}, with their current stage
          and status.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
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
        <div className="rounded-lg border bg-surface px-6 py-12 text-center">
          <p className="font-medium">
            {isFiltered
              ? "No PRs match your search."
              : "No procurement requests yet."}
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
                <TableHeaderCell>Procurement Mode</TableHeaderCell>
                <TableHeaderCell>Current stage</TableHeaderCell>
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
                  <TableCell className="min-w-36">{pr.stageName}</TableCell>
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

          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={PUBLIC_PAGE_SIZE}
            hrefForPage={(page) =>
              `/procurements${publicPrFiltersToQuery(filters, { page })}`
            }
          />
        </>
      )}
    </div>
  );
}
