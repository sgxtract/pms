import "server-only";
import {
  DASHBOARD_LIST_LIMIT,
  DELIVERY_DUE_SOON_DAYS,
  STALE_STAGE_DAYS,
} from "@/lib/dashboard-config";
import { sql } from "@/server/db";

export type DashboardSummary = {
  total: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  inProgressAbc: string;
  generatedAt: Date;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [summary] = await sql<DashboardSummary[]>`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE p.status = 'active' AND s.code <> 'completed')::int AS in_progress,
      count(*) FILTER (WHERE p.status = 'active' AND s.code = 'completed')::int AS completed,
      count(*) FILTER (WHERE p.status = 'cancelled')::int AS cancelled,
      coalesce(
        sum(p.abc) FILTER (WHERE p.status = 'active' AND s.code <> 'completed'), 0
      )::text AS in_progress_abc,
      now() AS generated_at
    FROM procurement_requests p
    JOIN procurement_stages s ON s.id = p.current_stage_id
  `;
  return summary;
}

export type StageCount = { code: string; name: string; count: number };

// In-progress PRs per stage, including stages with none.
export async function getStageCounts(): Promise<StageCount[]> {
  return sql<StageCount[]>`
    SELECT s.code, s.name, count(p.id)::int AS count
    FROM procurement_stages s
    LEFT JOIN procurement_requests p
      ON p.current_stage_id = s.id AND p.status = 'active'
    WHERE s.code <> 'completed' AND (s.is_active OR p.id IS NOT NULL)
    GROUP BY s.id, s.code, s.name, s.sort_order
    ORDER BY s.sort_order
  `;
}

export type ModeSummary = {
  id: string | null;
  name: string;
  count: number;
  totalAbc: string;
};

// In-progress PRs per procurement mode.
export async function getModeSummary(): Promise<ModeSummary[]> {
  return sql<ModeSummary[]>`
    SELECT m.id::text AS id,
           coalesce(m.name, 'Not specified') AS name,
           count(*)::int AS count,
           sum(p.abc)::text AS total_abc
    FROM procurement_requests p
    JOIN procurement_stages s ON s.id = p.current_stage_id
    LEFT JOIN procurement_modes m ON m.id = p.procurement_mode_id
    WHERE p.status = 'active' AND s.code <> 'completed'
    GROUP BY m.id, m.name, m.sort_order
    ORDER BY m.sort_order NULLS LAST
  `;
}

export type UpcomingDelivery = {
  id: string;
  prNumber: string;
  particulars: string;
  dueAt: Date;
  isOverdue: boolean;
  daysLeft: number;
  totalOverdue: number;
};

// Same rule as getDeliveryStatus() in src/lib/delivery.ts:
// due = latest Notice to Proceed + Calendar Days. Keep the two in sync.
export async function getUpcomingDeliveries(): Promise<UpcomingDelivery[]> {
  return sql<UpcomingDelivery[]>`
    WITH latest_ntp AS (
      SELECT DISTINCT ON (h.pr_id) h.pr_id, h.effective_at
      FROM pr_stage_history h
      JOIN procurement_stages ts ON ts.id = h.to_stage_id
      WHERE ts.code = 'notice_to_proceed'
      ORDER BY h.pr_id, h.effective_at DESC, h.id DESC
    ),
    deliveries AS (
      SELECT p.id, p.pr_number, p.particulars,
             n.effective_at + make_interval(days => p.calendar_days) AS due_at
      FROM procurement_requests p
      JOIN latest_ntp n ON n.pr_id = p.id
      JOIN procurement_stages s ON s.id = p.current_stage_id
      WHERE p.status = 'active'
        AND s.code <> 'completed'
        AND p.calendar_days IS NOT NULL
    )
      SELECT id, pr_number, particulars, due_at,
            due_at < now() AS is_overdue,
            ceil(extract(epoch FROM due_at - now()) / 86400)::int AS days_left,
            count(*) FILTER (WHERE due_at < now()) OVER ()::int AS total_overdue
      FROM deliveries
      WHERE due_at < now() + make_interval(days => ${DELIVERY_DUE_SOON_DAYS})
      ORDER BY due_at
      LIMIT ${DASHBOARD_LIST_LIMIT}
  `;
}

export type WaitingPr = {
  id: string;
  prNumber: string;
  particulars: string;
  stageName: string;
  daysInStage: number;
  totalWaiting: number;
};

// In-progress PRs that have been in their current stage too long.
export async function getWaitingPrs(): Promise<WaitingPr[]> {
  return sql<WaitingPr[]>`
    SELECT p.id, p.pr_number, p.particulars, s.name AS stage_name,
           floor(extract(epoch FROM now() - p.current_stage_at) / 86400)::int AS days_in_stage,
           count(*) OVER ()::int AS total_waiting
    FROM procurement_requests p
    JOIN procurement_stages s ON s.id = p.current_stage_id
    WHERE p.status = 'active'
      AND s.code <> 'completed'
      AND p.current_stage_at < now() - make_interval(days => ${STALE_STAGE_DAYS})
    ORDER BY p.current_stage_at
    LIMIT ${DASHBOARD_LIST_LIMIT}
  `;
}

export type CompletionStats = {
  completedThisMonth: number;
  completedThisYear: number;
  medianDaysThisYear: number | null;
};

// By completion date (what got finished), unlike Reports, which group by PR date.
export async function getCompletionStats(): Promise<CompletionStats> {
  const [stats] = await sql<CompletionStats[]>`
    WITH done AS (
      SELECT (p.current_stage_at AT TIME ZONE 'Asia/Manila')::date AS done_on, p.pr_date
      FROM procurement_requests p
      JOIN procurement_stages s ON s.id = p.current_stage_id
      WHERE p.status = 'active' AND s.code = 'completed'
    ),
    today AS (SELECT (now() AT TIME ZONE 'Asia/Manila')::date AS d)
    SELECT
      count(*) FILTER (WHERE done_on >= date_trunc('month', t.d))::int AS completed_this_month,
      count(*) FILTER (WHERE done_on >= date_trunc('year', t.d))::int AS completed_this_year,
      (percentile_cont(0.5) WITHIN GROUP (ORDER BY greatest(done_on - pr_date, 0))
        FILTER (WHERE done_on >= date_trunc('year', t.d)))::int AS median_days_this_year
    FROM done CROSS JOIN today t
  `;
  return stats;
}
