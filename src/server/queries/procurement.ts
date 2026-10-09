import "server-only";
import { PR_PAGE_SIZE, type PrFilters } from "@/lib/pr-filters";
import { sql } from "@/server/db";

export type Option = { id: string; name: string };

export async function getPrFormOptions(
  current: {
    typeId?: string | null;
    categoryId?: string | null;
    modeId?: string | null;
  } = {},
) {
  const [types, categories, modes] = await Promise.all([
    sql<Option[]>`
      SELECT id::text, name FROM pr_types
      WHERE is_active OR id::text = ${current.typeId ?? ""}
      ORDER BY sort_order, name
    `,
    sql<Option[]>`
      SELECT id::text, name FROM pr_categories
      WHERE is_active OR id::text = ${current.categoryId ?? ""}
      ORDER BY sort_order, name
    `,
    sql<Option[]>`
      SELECT id::text, name FROM procurement_modes
      WHERE is_active OR id::text = ${current.modeId ?? ""}
      ORDER BY sort_order, name
    `,
  ]);
  return { types, categories, modes };
}

export type PrSuggestions = {
  endUsers: string[];
  sourcesOfFunds: string[];
  accountCodes: string[];
  referenceCodes: string[];
};

export async function getPrSuggestions(): Promise<PrSuggestions> {
  type Row = { value: string };
  const [endUsers, sourcesOfFunds, accountCodes, referenceCodes] =
    await Promise.all([
      sql<
        Row[]
      >`SELECT DISTINCT end_user AS value FROM procurement_requests ORDER BY value`,
      sql<
        Row[]
      >`SELECT DISTINCT source_of_funds AS value FROM procurement_requests ORDER BY value`,
      sql<
        Row[]
      >`SELECT DISTINCT account_code AS value FROM procurement_requests ORDER BY value`,
      sql<
        Row[]
      >`SELECT reference_code AS value FROM pr_references ORDER BY created_at DESC LIMIT 300`,
    ]);

  const values = (rows: Row[]) => rows.map((row) => row.value);
  return {
    endUsers: values(endUsers),
    sourcesOfFunds: values(sourcesOfFunds),
    accountCodes: values(accountCodes),
    referenceCodes: values(referenceCodes),
  };
}

export type PrDetail = {
  id: string;
  prNumber: string;
  prDate: string;
  referenceCode: string | null;
  prType: string | null;
  category: string;
  endUser: string;
  particulars: string;
  abc: string;
  sourceOfFunds: string;
  procurementMode: string | null;
  calendarDays: number | null;
  accountCode: string;
  currentStage: string;
  currentStageAt: Date;
  status: "active" | "cancelled";
  createdAt: Date;
  createdBy: string;
  currentStageId: string;
  currentStageCode: string;
  currentSortOrder: number;
  prTypeId: string | null;
  prCategoryId: string;
  procurementModeId: string | null;
  version: string;
};

export async function getPrById(id: string): Promise<PrDetail | null> {
  if (!/^\d+$/.test(id)) return null;

  const [pr] = await sql<PrDetail[]>`
    SELECT p.id, p.pr_number, p.pr_date::text AS pr_date,
           r.reference_code, t.name AS pr_type, c.name AS category,
           p.end_user, p.particulars, p.abc, p.source_of_funds,
           m.name AS procurement_mode, p.calendar_days, p.account_code,
           s.name AS current_stage, p.current_stage_at, p.status,
           p.current_stage_id::text AS current_stage_id,
           s.code AS current_stage_code, s.sort_order AS current_sort_order,
           p.created_at, u.full_name AS created_by,
           p.pr_type_id::text AS pr_type_id,
           p.pr_category_id::text AS pr_category_id,
           p.procurement_mode_id::text AS procurement_mode_id,
           p.updated_at::text AS version
    FROM procurement_requests p
    LEFT JOIN pr_references r ON r.id = p.reference_id
    LEFT JOIN pr_types t ON t.id = p.pr_type_id
    JOIN pr_categories c ON c.id = p.pr_category_id
    LEFT JOIN procurement_modes m ON m.id = p.procurement_mode_id
    JOIN procurement_stages s ON s.id = p.current_stage_id
    JOIN users u ON u.id = p.created_by
    WHERE p.id = ${id}
  `;
  return pr ?? null;
}

export async function getPrFilterOptions() {
  const [stages, modes, categories, types] = await Promise.all([
    sql<{ code: string; name: string }[]>`
      SELECT code, name FROM procurement_stages ORDER BY sort_order
    `,
    sql<
      Option[]
    >`SELECT id::text, name FROM procurement_modes ORDER BY sort_order, name`,
    sql<
      Option[]
    >`SELECT id::text, name FROM pr_categories ORDER BY sort_order, name`,
    sql<
      Option[]
    >`SELECT id::text, name FROM pr_types ORDER BY sort_order, name`,
  ]);
  return { stages, modes, categories, types };
}

export type PrListItem = {
  id: string;
  prNumber: string;
  prDate: string;
  referenceCode: string | null;
  particulars: string;
  endUser: string;
  abc: string;
  procurementMode: string | null;
  stageCode: string;
  stageName: string;
  status: "active" | "cancelled";
};

// Makes % and _ in the user's search match literally.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function prListFrom() {
  return sql`
    FROM procurement_requests p
    LEFT JOIN pr_references r ON r.id = p.reference_id
    LEFT JOIN procurement_modes m ON m.id = p.procurement_mode_id
    JOIN procurement_stages s ON s.id = p.current_stage_id
  `;
}

function prListWhere(filters: PrFilters) {
  const conditions = [sql`TRUE`];

  if (filters.q) {
    const pattern = `%${escapeLike(filters.q)}%`;
    conditions.push(sql`(
      p.pr_number ILIKE ${pattern}
      OR r.reference_code ILIKE ${pattern}
      OR p.particulars ILIKE ${pattern}
      OR p.end_user ILIKE ${pattern}
    )`);
  }
  if (filters.status) conditions.push(sql`p.status = ${filters.status}`);
  if (filters.stage) conditions.push(sql`s.code = ${filters.stage}`);
  if (filters.mode)
    conditions.push(sql`p.procurement_mode_id::text = ${filters.mode}`);
  if (filters.category)
    conditions.push(sql`p.pr_category_id::text = ${filters.category}`);
  if (filters.type) conditions.push(sql`p.pr_type_id::text = ${filters.type}`);
  if (filters.from) conditions.push(sql`p.pr_date >= ${filters.from}`);
  if (filters.to) conditions.push(sql`p.pr_date <= ${filters.to}`);
  if (filters.abcMin) conditions.push(sql`p.abc >= ${filters.abcMin}`);
  if (filters.abcMax) conditions.push(sql`p.abc <= ${filters.abcMax}`);

  return conditions.reduce(
    (combined, condition) => sql`${combined} AND ${condition}`,
  );
}

export async function listPrs(filters: PrFilters) {
  const [summary] = await sql<{ total: number; totalAbc: string }[]>`
    SELECT count(*)::int AS total, coalesce(sum(p.abc), 0)::text AS total_abc
    ${prListFrom()}
    WHERE ${prListWhere(filters)}
  `;

  const pageCount = Math.max(1, Math.ceil(summary.total / PR_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  const rows = await sql<PrListItem[]>`
    SELECT p.id, p.pr_number, p.pr_date::text AS pr_date, r.reference_code,
           p.particulars, p.end_user, p.abc, m.name AS procurement_mode,
           s.code AS stage_code, s.name AS stage_name, p.status
    ${prListFrom()}
    WHERE ${prListWhere(filters)}
    ORDER BY p.pr_date DESC, p.id DESC
    LIMIT ${PR_PAGE_SIZE}
    OFFSET ${(page - 1) * PR_PAGE_SIZE}
  `;

  return {
    rows,
    total: summary.total,
    totalAbc: summary.totalAbc,
    page,
    pageCount,
  };
}

export type StageOption = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
};

export async function getActiveStages(): Promise<StageOption[]> {
  return sql<StageOption[]>`
    SELECT id::text, code, name, sort_order
    FROM procurement_stages
    WHERE is_active
    ORDER BY sort_order
  `;
}

export type StageHistoryEntry = {
  id: string;
  fromStage: string | null;
  fromSortOrder: number | null;
  toStage: string;
  toStageCode: string;
  toSortOrder: number;
  effectiveAt: Date;
  recordedAt: Date;
  recordedBy: string;
  remarks: string | null;
};

// Newest first: the first entry is the PR's current stage.
export async function getStageHistory(
  prId: string,
): Promise<StageHistoryEntry[]> {
  return sql<StageHistoryEntry[]>`
    SELECT h.id,
           f.name AS from_stage, f.sort_order AS from_sort_order,
           t.name AS to_stage, t.code AS to_stage_code, t.sort_order AS to_sort_order,
           h.effective_at, h.recorded_at, u.full_name AS recorded_by, h.remarks
    FROM pr_stage_history h
    LEFT JOIN procurement_stages f ON f.id = h.from_stage_id
    JOIN procurement_stages t ON t.id = h.to_stage_id
    JOIN users u ON u.id = h.recorded_by
    WHERE h.pr_id = ${prId}
    ORDER BY h.effective_at DESC, h.id DESC
  `;
}

export type StatusHistoryEntry = {
  id: string;
  action: "cancelled" | "restored";
  remarks: string;
  actedAt: Date;
  actedBy: string;
};

// Newest first.
export async function getStatusHistory(
  prId: string,
): Promise<StatusHistoryEntry[]> {
  return sql<StatusHistoryEntry[]>`
    SELECT h.id, h.action, h.remarks, h.acted_at, u.full_name AS acted_by
    FROM pr_status_history h
    JOIN users u ON u.id = h.acted_by
    WHERE h.pr_id = ${prId}
    ORDER BY h.acted_at DESC, h.id DESC
  `;
}
