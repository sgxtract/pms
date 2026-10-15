import type { Metadata } from "next";
import { AbcBreakdownTable } from "@/components/features/reports/abc-breakdown-table";
import { ReportPeriodForm } from "@/components/features/reports/report-period-form";
import { FormMessage } from "@/components/ui/form-message";
import { todayInManila } from "@/lib/dates";
import { formatDateTime, formatPeso } from "@/lib/format";
import {
  REPORT_PERIODS,
  describeRange,
  parseReportParams,
  reportParamsToQuery,
  resolvePeriod,
} from "@/lib/report-period";
import type { SearchParams } from "@/lib/search-params";
import { requirePermission } from "@/server/auth/authorize";
import { getAbcBreakdown, getReportOverview } from "@/server/queries/reports";

export const metadata: Metadata = { title: "Reports" };

function Figure({
  label,
  count,
  abc,
  muted = false,
}: {
  label: string;
  count: number;
  abc: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-surface p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
        {count} {count === 1 ? "PR" : "PRs"}
      </p>
      <p
        className={`mt-0.5 text-sm tabular-nums ${muted ? "text-muted-foreground" : ""}`}
      >
        {formatPeso(abc)}
      </p>
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission("report.view");
  const params = parseReportParams(await searchParams);
  const period = resolvePeriod(params, todayInManila());

  const [overview, byMode, byCategory] = await Promise.all([
    getReportOverview(period),
    getAbcBreakdown("mode", period),
    getAbcBreakdown("category", period),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Procurement figures for a period. PRs are included by their PR date.
        </p>
      </div>

      <ReportPeriodForm key={reportParamsToQuery(params)} params={params} />

      {period.notice && (
        <FormMessage tone="warning">{period.notice}</FormMessage>
      )}

      <section aria-labelledby="report-title" className="space-y-8">
        <div>
          <h2 id="report-title" className="text-xl font-semibold">
            Procurement report: {REPORT_PERIODS[period.key]}
          </h2>
          <p className="text-sm text-muted-foreground">
            {describeRange(period)}. Generated{" "}
            {formatDateTime(overview.generatedAt)}.
          </p>
        </div>

        {overview.count === 0 ? (
          <div className="rounded-lg border bg-surface px-6 py-12 text-center">
            <p className="font-medium">No PRs have a PR date in this period.</p>
          </div>
        ) : (
          <>
            <section aria-labelledby="overview-heading" className="space-y-3">
              <h3 id="overview-heading" className="font-semibold">
                Financial overview
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Figure
                  label="Total ABC (excluding cancelled)"
                  count={overview.inProgressCount + overview.completedCount}
                  abc={overview.activeAbc}
                />
                <Figure
                  label="In progress"
                  count={overview.inProgressCount}
                  abc={overview.inProgressAbc}
                />
                <Figure
                  label="Completed"
                  count={overview.completedCount}
                  abc={overview.completedAbc}
                />
                <Figure
                  label="Cancelled (not included)"
                  count={overview.cancelledCount}
                  abc={overview.cancelledAbc}
                  muted
                />
              </div>
            </section>

            <AbcBreakdownTable
              title="Total ABC by Procurement Mode"
              groupLabel="Procurement Mode"
              rows={byMode}
              totals={overview}
            />

            <AbcBreakdownTable
              title="Total ABC by Category"
              groupLabel="Category"
              rows={byCategory}
              totals={overview}
            />
          </>
        )}
      </section>
    </div>
  );
}
