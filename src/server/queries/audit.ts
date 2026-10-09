import "server-only";
import { AUDIT_PAGE_SIZE, type AuditFilters } from "@/lib/audit-filters";
import { manilaInputToDate } from "@/lib/dates";
import type { AuditScope } from "@/lib/permissions";
import type { Role } from "@/lib/roles";
import { sql } from "@/server/db";

const DAY_MS = 24 * 60 * 60 * 1000;

export type AuditLogEntry = {
  id: string;
  createdAt: Date;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  actorId: string | null;
  actorRole: Role | null;
  actorName: string | null;
  subjectPrNumber: string | null;
  subjectUserName: string | null;
  subjectUserRole: Role | null;
  subjectUserId: string | null;
};

function auditWhere(
  scope: AuditScope,
  viewerId: string,
  filters: AuditFilters,
) {
  // Visibility (decisions log 3.2) is always the first condition.
  const conditions = [
    scope === "all"
      ? sql`TRUE`
      : scope === "all_except_admin"
        ? sql`a.actor_role IN ('moderator', 'user')`
        : sql`a.actor_id = ${viewerId}`,
  ];

  if (filters.area) conditions.push(sql`a.action LIKE ${`${filters.area}.%`}`);
  if (filters.actor && scope !== "own")
    conditions.push(sql`a.actor_id = ${filters.actor}`);

  // A "day" is midnight to midnight in Manila.
  if (filters.from) {
    conditions.push(
      sql`a.created_at >= ${manilaInputToDate(`${filters.from}T00:00`)}`,
    );
  }
  if (filters.to) {
    const endOfDay = new Date(
      manilaInputToDate(`${filters.to}T00:00`).getTime() + DAY_MS,
    );
    conditions.push(sql`a.created_at < ${endOfDay}`);
  }

  return conditions.reduce(
    (combined, condition) => sql`${combined} AND ${condition}`,
  );
}

export async function listAuditLogs(
  scope: AuditScope,
  viewerId: string,
  filters: AuditFilters,
) {
  const [summary] = await sql<{ total: number }[]>`
    SELECT count(*)::int AS total
    FROM audit_logs a
    WHERE ${auditWhere(scope, viewerId, filters)}
  `;

  const pageCount = Math.max(1, Math.ceil(summary.total / AUDIT_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  const rows = await sql<AuditLogEntry[]>`
    SELECT a.id, a.created_at, a.action, a.entity_type, a.entity_id, a.changes,
           a.ip_address::text AS ip_address, a.actor_id, a.actor_role,
           actor.full_name AS actor_name,
           pr.pr_number AS subject_pr_number,
           subject.full_name AS subject_user_name,
           subject.role AS subject_user_role,
           subject.id AS subject_user_id
    FROM audit_logs a
    LEFT JOIN users actor ON actor.id = a.actor_id
    LEFT JOIN procurement_requests pr
      ON a.entity_type = 'procurement_request' AND pr.id::text = a.entity_id
    LEFT JOIN users subject
      ON (a.entity_type = 'user' AND subject.id::text = a.entity_id)
      OR (a.entity_type = 'auth' AND subject.employee_id = a.entity_id)
    WHERE ${auditWhere(scope, viewerId, filters)}
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT ${AUDIT_PAGE_SIZE}
    OFFSET ${(page - 1) * AUDIT_PAGE_SIZE}
  `;

  return { rows, total: summary.total, page, pageCount };
}

export async function getAuditActorOptions(roles: Role[]) {
  if (roles.length === 0) return [];
  return sql<{ id: string; fullName: string; role: Role }[]>`
    SELECT id, full_name, role
    FROM users
    WHERE role IN ${sql(roles)}
    ORDER BY full_name
  `;
}
