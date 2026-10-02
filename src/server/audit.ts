import "server-only";
import { sql } from "@/server/db";
import type { RequestMeta } from "@/server/request-meta";

type AuditEntry = {
  actor: { id: string; role: string } | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  changes?: unknown;
  meta?: RequestMeta;
};

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const changes =
    entry.changes === undefined ? null : JSON.stringify(entry.changes);

  await sql`
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
