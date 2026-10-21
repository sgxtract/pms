import "server-only";
import { sql } from "@/server/db";
import { prStatusGroupCondition } from "@/server/queries/procurement";

type DateRange = { from: string | null; to: string | null };

// Decision: a PR belongs to a period by its PR date.
function periodCondition(range: DateRange) {
  const conditions = [sql`TRUE`];
  if (range.from) conditions.push(sql`p.pr_date >= ${range.from}`);
  if (range.to) conditions.push(sql`p.pr_date <= ${range.to}`);
  return conditions.reduce(
    (combined, condition) => sql`${combined} AND ${condition}`,
  );
}

export type ReportTotals = {
  count: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  inProgressAbc: string;
  completedAbc: string;
  cancelledAbc: string;
  // In progress + Completed: the total excluding cancelled PRs.
  activeAbc: string;
};

export type ReportOverview = ReportTotals & { generatedAt: Date };

export type BreakdownRow = ReportTotals & { key: string; name: string };

// The same totals columns for the overview and for every breakdown row.
function totalsColumns() {
  return sql`
    count(*)::int AS count,
    count(*) FILTER (WHERE ${prStatusGroupCondition("in_progress")})::int AS in_progress_count,
    count(*) FILTER (WHERE ${prStatusGroupCondition("completed")})::int AS completed_count,
    count(*) FILTER (WHERE ${prStatusGroupCondition("cancelled")})::int AS cancelled_count,
    coalesce(sum(p.abc) FILTER (WHERE ${prStatusGroupCondition("in_progress")}), 0)::text AS in_progress_abc,
    coalesce(sum(p.abc) FILTER (WHERE ${prStatusGroupCondition("completed")}), 0)::text AS completed_abc,
    coalesce(sum(p.abc) FILTER (WHERE ${prStatusGroupCondition("cancelled")}), 0)::text AS cancelled_abc,
    coalesce(sum(p.abc) FILTER (WHERE p.status = 'active'), 0)::text AS active_abc
  `;
}

export async function getReportOverview(
  range: DateRange,
): Promise<ReportOverview> {
  const [overview] = await sql<ReportOverview[]>`
    SELECT ${totalsColumns()}, now() AS generated_at
    FROM procurement_requests p
    JOIN procurement_stages s ON s.id = p.current_stage_id
    WHERE ${periodCondition(range)}
  `;
  return overview;
}

export async function getAbcBreakdown(
  dimension: "mode" | "category",
  range: DateRange,
): Promise<BreakdownRow[]> {
  const join =
    dimension === "mode"
      ? sql`LEFT JOIN procurement_modes d ON d.id = p.procurement_mode_id`
      : sql`JOIN pr_categories d ON d.id = p.pr_category_id`;

  return sql<BreakdownRow[]>`
    SELECT coalesce(d.id::text, 'none') AS key,
           coalesce(d.name, 'Not specified') AS name,
           ${totalsColumns()}
    FROM procurement_requests p
    JOIN procurement_stages s ON s.id = p.current_stage_id
    ${join}
    WHERE ${periodCondition(range)}
    GROUP BY d.id, d.name, d.sort_order
    ORDER BY d.sort_order NULLS LAST, d.name
  `;
}

export const EMPTY_TOTALS: ReportTotals = {
  count: 0,
  inProgressCount: 0,
  completedCount: 0,
  cancelledCount: 0,
  inProgressAbc: "0",
  completedAbc: "0",
  cancelledAbc: "0",
  activeAbc: "0",
};

export type MonthlyRow = ReportTotals & { month: string }; // "2026-10"

// Same totalsColumns() and period filter as the overview,
// so the months always add up to the overview figures.
export async function getMonthlyTotals(
  range: DateRange,
): Promise<MonthlyRow[]> {
  return sql<MonthlyRow[]>`
    SELECT to_char(p.pr_date, 'YYYY-MM') AS month, ${totalsColumns()}
    FROM procurement_requests p
    JOIN procurement_stages s ON s.id = p.current_stage_id
    WHERE ${periodCondition(range)}
    GROUP BY 1
    ORDER BY 1
  `;
}

export type ProcessingRow = {
  key: string;
  name: string;
  isTotal: boolean;
  completedCount: number;
  medianDays: number | null;
  avgDays: number | null;
  longestDays: number | null;
};

// Completed PRs only: days from the PR date to the day it reached Completed.
export async function getProcessingTimes(
  range: DateRange,
): Promise<ProcessingRow[]> {
  return sql<ProcessingRow[]>`
    WITH done AS (
      SELECT p.procurement_mode_id AS mode_id,
             greatest((p.current_stage_at AT TIME ZONE 'Asia/Manila')::date - p.pr_date, 0) AS days
      FROM procurement_requests p
      JOIN procurement_stages s ON s.id = p.current_stage_id
      WHERE p.status = 'active'
        AND s.code = 'completed'
        AND ${periodCondition(range)}
    )
    SELECT
      CASE WHEN grouping(m.id) = 1 THEN 'total' ELSE coalesce(m.id::text, 'none') END AS key,
      CASE WHEN grouping(m.id) = 1 THEN 'All modes' ELSE coalesce(m.name, 'Not specified') END AS name,
      grouping(m.id) = 1 AS is_total,
      count(*)::int AS completed_count,
      (percentile_cont(0.5) WITHIN GROUP (ORDER BY d.days))::int AS median_days,
      round(avg(d.days))::int AS avg_days,
      max(d.days)::int AS longest_days
    FROM done d
    LEFT JOIN procurement_modes m ON m.id = d.mode_id
    GROUP BY GROUPING SETS ((m.id, m.name, m.sort_order), ())
    ORDER BY grouping(m.id), m.sort_order NULLS LAST, m.name
  `;
}
