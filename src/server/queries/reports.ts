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
