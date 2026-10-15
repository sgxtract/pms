import "server-only";
import { containsPattern } from "@/lib/like";
import {
  PUBLIC_PAGE_SIZE,
  type PublicPrFilters,
} from "@/lib/public-pr-filters";
import { sql } from "@/server/db";
import {
  prStatusGroupCondition,
  type Option,
} from "@/server/queries/procurement";

// Only the columns approved for public view (decisions log, section 9).
export type PublicPr = {
  id: string;
  prNumber: string;
  prDate: string;
  particulars: string;
  endUser: string;
  abc: string;
  procurementMode: string | null;
  stageCode: string;
  stageName: string;
  status: "active" | "cancelled";
};

function publicFrom() {
  return sql`
    FROM procurement_requests p
    JOIN procurement_stages s ON s.id = p.current_stage_id
    LEFT JOIN procurement_modes m ON m.id = p.procurement_mode_id
  `;
}

function publicWhere(filters: PublicPrFilters) {
  const conditions = [sql`TRUE`];

  // Search only columns that are shown publicly.
  if (filters.q) {
    const pattern = containsPattern(filters.q);
    conditions.push(sql`(
      p.pr_number ILIKE ${pattern}
      OR p.particulars ILIKE ${pattern}
      OR p.end_user ILIKE ${pattern}
    )`);
  }
  if (filters.status) conditions.push(prStatusGroupCondition(filters.status));
  if (filters.stage) conditions.push(sql`s.code = ${filters.stage}`);
  if (filters.mode)
    conditions.push(sql`p.procurement_mode_id::text = ${filters.mode}`);

  return conditions.reduce(
    (combined, condition) => sql`${combined} AND ${condition}`,
  );
}

export async function listPublicPrs(filters: PublicPrFilters) {
  const [summary] = await sql<{ total: number; totalAbc: string }[]>`
    SELECT count(*)::int AS total, coalesce(sum(p.abc), 0)::text AS total_abc
    ${publicFrom()}
    WHERE ${publicWhere(filters)}
  `;

  const pageCount = Math.max(1, Math.ceil(summary.total / PUBLIC_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  const rows = await sql<PublicPr[]>`
    SELECT p.id, p.pr_number, p.pr_date::text AS pr_date, p.particulars,
           p.end_user, p.abc, m.name AS procurement_mode,
           s.code AS stage_code, s.name AS stage_name, p.status
    ${publicFrom()}
    WHERE ${publicWhere(filters)}
    ORDER BY p.pr_date DESC, p.id DESC
    LIMIT ${PUBLIC_PAGE_SIZE}
    OFFSET ${(page - 1) * PUBLIC_PAGE_SIZE}
  `;

  return {
    rows,
    total: summary.total,
    totalAbc: summary.totalAbc,
    page,
    pageCount,
  };
}

export async function getPublicFilterOptions() {
  const [stages, modes] = await Promise.all([
    sql<{ code: string; name: string }[]>`
      SELECT code, name FROM procurement_stages ORDER BY sort_order
    `,
    sql<Option[]>`
      SELECT id::text, name FROM procurement_modes ORDER BY sort_order, name
    `,
  ]);
  return { stages, modes };
}
