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
import {
  getAbcBreakdown,
  getReportOverview,
  EMPTY_TOTALS,
  getMonthlyTotals,
  getProcessingTimes,
} from "@/server/queries/reports";
import { PrintButton } from "@/components/features/reports/print-button";
import { ReportLetterhead } from "@/components/features/reports/report-letterhead";
import { SignatureBlock } from "@/components/features/reports/signature-block";
import { getReportSignatories } from "@/server/queries/settings";
import { SITE } from "@/lib/site-config";
import { MonthlyTrendTable } from "@/components/features/reports/monthly-trend-table";
import { ProcessingTimeTable } from "@/components/features/reports/processing-time-table";
import { fillMonths } from "@/lib/report-months";

export const metadata: Metadata = { title: "Reports" };

function Figure({
  label,
  count,
  abc,
  variant = "glass",
}: {
  label: string;
  count: number;
  abc: string;
  variant?: "ink" | "glass" | "muted";
}) {
  const isInk = variant === "ink";
  return (
    <div className={isInk ? "ink p-5" : "glass p-5"}>
      <p
        className={`text-sm ${isInk ? "text-on-ink-muted" : "text-muted-foreground"}`}
      >
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
        {count} {count === 1 ? "PR" : "PRs"}
      </p>
      <p
        className={`mt-0.5 text-sm tabular-nums ${variant === "muted" ? "text-muted-foreground" : ""}`}
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
  const user = await requirePermission("report.view");
  const params = parseReportParams(await searchParams);
  const today = todayInManila();
  const period = resolvePeriod(params, today);

  const [overview, byMode, byCategory, signatories, monthlyRows, processing] =
    await Promise.all([
      getReportOverview(period),
      getAbcBreakdown("mode", period),
      getAbcBreakdown("category", period),
      getReportSignatories(),
      getMonthlyTotals(period),
      getProcessingTimes(period),
    ]);

  const monthly = fillMonths(monthlyRows, period, today, (month) => ({
    month,
    ...EMPTY_TOTALS,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="mt-1 text-sm text-foreground/75">
            Procurement figures for a period. PRs are included by their PR date.
          </p>
        </div>
        {overview.count > 0 && <PrintButton />}
      </div>

      <div className="space-y-4 print:hidden">
        <ReportPeriodForm key={reportParamsToQuery(params)} params={params} />
        {period.notice && (
          <FormMessage tone="warning">{period.notice}</FormMessage>
        )}
      </div>

      <section aria-labelledby="report-title" className="space-y-8">
        <ReportLetterhead />
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
          <div className="glass px-6 py-12 text-center">
            <p className="font-medium">No PRs have a PR date in this period.</p>
          </div>
        ) : (
          <>
            <section aria-labelledby="overview-heading" className="space-y-3">
              <h3 id="overview-heading" className="font-semibold">
                Financial overview
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
                <Figure
                  label="Total ABC (excluding cancelled)"
                  count={overview.inProgressCount + overview.completedCount}
                  abc={overview.activeAbc}
                  variant="ink"
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
                  variant="muted"
                />
              </div>
            </section>

            {/* after the Financial overview <section> */}
            {monthly.length > 1 && (
              <MonthlyTrendTable rows={monthly} totals={overview} />
            )}

            {/* the two existing AbcBreakdownTable lines stay here */}

            {/* after the Category table, before the SignatureBlock */}
            <ProcessingTimeTable rows={processing} />

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
            <SignatureBlock signatories={signatories} />
            <p className="hidden text-xs text-muted-foreground print:block">
              Printed by {user.fullName} from the {SITE.systemName}.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
