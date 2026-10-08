import "server-only";
import { sql } from "@/server/db";

export type Option = { id: string; name: string };

export async function getPrFormOptions() {
  const [types, categories, modes] = await Promise.all([
    sql<Option[]>`
      SELECT id::text, name FROM pr_types
      WHERE is_active ORDER BY sort_order, name
    `,
    sql<Option[]>`
      SELECT id::text, name FROM pr_categories
      WHERE is_active ORDER BY sort_order, name
    `,
    sql<Option[]>`
      SELECT id::text, name FROM procurement_modes
      WHERE is_active ORDER BY sort_order, name
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
};

export async function getPrById(id: string): Promise<PrDetail | null> {
  if (!/^\d+$/.test(id)) return null;

  const [pr] = await sql<PrDetail[]>`
    SELECT p.id, p.pr_number, p.pr_date::text AS pr_date,
           r.reference_code, t.name AS pr_type, c.name AS category,
           p.end_user, p.particulars, p.abc, p.source_of_funds,
           m.name AS procurement_mode, p.calendar_days, p.account_code,
           s.name AS current_stage, p.current_stage_at, p.status,
           p.created_at, u.full_name AS created_by
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
