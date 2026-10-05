import "server-only";
import { sql, type Db } from "@/server/db";
import type { RequestMeta } from "@/server/request-meta";

type AuditEntry = {
  actor: { id: string; role: string } | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  changes?: unknown;
  meta?: RequestMeta;
};

export async function writeAuditLog(
  entry: AuditEntry,
  db: Db = sql,
): Promise<void> {
  const changes =
    entry.changes === undefined ? null : JSON.stringify(entry.changes);

  await db`
    INSERT INTO audit_logs
      (actor_id, actor_role, action, entity_type, entity_id, changes, ip_address, user_agent)
    VALUES (
      ${entry.actor?.id ?? null},
      ${entry.actor?.role ?? null},
      ${entry.action},
      ${entry.entityType},
      ${entry.entityId ?? null},
      ${changes}::jsonb,
      ${entry.meta?.ipAddress ?? null},
      ${entry.meta?.userAgent ?? null}
    )
  `;
}

// Returns only the fields that changed, as { field: { from, to } }.
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const field of fields) {
    if (before[field] !== after[field]) {
      changes[field] = { from: before[field], to: after[field] };
    }
  }
  return changes;
}
