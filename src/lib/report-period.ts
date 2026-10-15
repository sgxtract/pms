import { z } from "zod";
import { formatDate } from "@/lib/format";
import {
  dateParam,
  firstValue,
  toQueryString,
  type SearchParams,
} from "@/lib/search-params";

export const REPORT_PERIODS = {
  all: "All time",
  this_month: "This month",
  last_month: "Last month",
  this_quarter: "This quarter",
  this_year: "This year",
  custom: "Custom range",
} as const;

export type ReportPeriodKey = keyof typeof REPORT_PERIODS;

const periodKeys = Object.keys(REPORT_PERIODS) as [
  ReportPeriodKey,
  ...ReportPeriodKey[],
];

export const reportParamsSchema = z.object({
  period: z.preprocess(firstValue, z.enum(periodKeys)).catch("this_year"),
  from: dateParam,
  to: dateParam,
});

export type ReportParams = z.infer<typeof reportParamsSchema>;

export function parseReportParams(searchParams: SearchParams): ReportParams {
  return reportParamsSchema.parse(searchParams);
}

export function reportParamsToQuery(params: ReportParams): string {
  return toQueryString(params);
}

export type ResolvedPeriod = {
  key: ReportPeriodKey;
  from: string | null;
  to: string | null;
  notice?: string;
};

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Day 0 of the next month is the last day of this month.
function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function wholeMonth(year: number, month: number) {
  return {
    from: isoDate(year, month, 1),
    to: isoDate(year, month, lastDayOfMonth(year, month)),
  };
}

// Turns a period choice into an inclusive PR date range.
// `today` is YYYY-MM-DD in Manila, passed in so the function can be tested.
export function resolvePeriod(
  params: ReportParams,
  today: string,
): ResolvedPeriod {
  const [year, month] = today.split("-").map(Number);

  switch (params.period) {
    case "all":
      return { key: "all", from: null, to: null };

    case "this_month":
      return { key: "this_month", ...wholeMonth(year, month) };

    case "last_month":
      return month === 1
        ? { key: "last_month", ...wholeMonth(year - 1, 12) }
        : { key: "last_month", ...wholeMonth(year, month - 1) };

    case "this_quarter": {
      const firstMonth = Math.floor((month - 1) / 3) * 3 + 1;
      const lastMonth = firstMonth + 2;
      return {
        key: "this_quarter",
        from: isoDate(year, firstMonth, 1),
        to: isoDate(year, lastMonth, lastDayOfMonth(year, lastMonth)),
      };
    }

    case "this_year":
      return {
        key: "this_year",
        from: isoDate(year, 1, 1),
        to: isoDate(year, 12, 31),
      };

    case "custom":
      if (!params.from || !params.to) {
        return {
          key: "all",
          from: null,
          to: null,
          notice:
            "Choose both dates for a custom range. Showing all time instead.",
        };
      }
      if (params.from > params.to) {
        return {
          key: "all",
          from: null,
          to: null,
          notice:
            "The start date is after the end date. Showing all time instead.",
        };
      }
      return { key: "custom", from: params.from, to: params.to };
  }
}

export function describeRange(period: ResolvedPeriod): string {
  if (!period.from || !period.to) return "All PRs";
  if (period.from === period.to) return formatDate(period.from);
  return `${formatDate(period.from)} to ${formatDate(period.to)}`;
}
