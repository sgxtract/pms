import type { Metadata } from "next";
import Link from "next/link";
import { AuditChanges } from "@/components/features/audit/audit-changes";
import { AuditFilterBar } from "@/components/features/audit/audit-filter-bar";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import {
  AUDIT_PAGE_SIZE,
  auditFiltersToQuery,
  hasActiveAuditFilters,
  parseAuditFilters,
} from "@/lib/audit-filters";
import { AUDIT_ACTION_LABELS } from "@/lib/audit-labels";
import { formatDateTime } from "@/lib/format";
import {
  auditScope,
  canManageUser,
  visibleUserRoles,
  type AuditScope,
} from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import type { SearchParams } from "@/lib/search-params";
import { requireUser, type SessionUser } from "@/server/auth/session";
import {
  getAuditActorOptions,
  listAuditLogs,
  type AuditLogEntry,
} from "@/server/queries/audit";

export const metadata: Metadata = { title: "Audit log" };

const SCOPE_DESCRIPTIONS: Record<AuditScope, string> = {
  all: "All recorded activity in the system.",
  all_except_admin:
    "Activity by Moderators and Users. Administrator activity and system events are not shown.",
  own: "Your own recorded activity.",
};

function Subject({
  entry,
  viewer,
}: {
  entry: AuditLogEntry;
  viewer: SessionUser;
}) {
  if (entry.entityType === "procurement_request" && entry.entityId) {
    return (
      <Link
        href={`/requests/${entry.entityId}`}
        className="font-mono text-link hover:underline"
      >
        PR {entry.subjectPrNumber ?? entry.entityId}
      </Link>
    );
  }

  if (
    (entry.entityType === "user" || entry.entityType === "auth") &&
    entry.entityId
  ) {
    const label =
      entry.entityType === "auth" ? (
        <span className="font-mono">{entry.entityId}</span>
      ) : (
        <span>{entry.subjectUserName ?? `User ${entry.entityId}`}</span>
      );

    const canOpen =
      entry.subjectUserId !== null &&
      entry.subjectUserRole !== null &&
      canManageUser(viewer, { role: entry.subjectUserRole });

    return canOpen ? (
      <Link
        href={`/users/${entry.subjectUserId}`}
        className="text-link hover:underline"
      >
        {label}
      </Link>
    ) : (
      label
    );
  }

  return <span className="text-muted-foreground">None</span>;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const scope = auditScope(user);
  const filters = parseAuditFilters(await searchParams);

  const [result, actors] = await Promise.all([
    listAuditLogs(scope, user.id, filters),
    scope === "own"
      ? Promise.resolve([])
      : getAuditActorOptions(visibleUserRoles(user)),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {SCOPE_DESCRIPTIONS[scope]}
        </p>
      </div>

      <AuditFilterBar
        key={auditFiltersToQuery(filters, { page: 1 })}
        filters={filters}
        actors={actors}
        showActorFilter={scope !== "own"}
      />

      {result.total === 0 ? (
        <div className="rounded-lg border bg-surface px-6 py-12 text-center">
          <p className="font-medium">
            {hasActiveAuditFilters(filters)
              ? "No activity matches these filters."
              : "No activity recorded yet."}
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>When</TableHeaderCell>
                <TableHeaderCell>Who</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
                <TableHeaderCell>Subject</TableHeaderCell>
                <TableHeaderCell>Details</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.rows.map((entry) => (
                <TableRow key={entry.id} className="align-top">
                  <TableCell className="whitespace-nowrap">
                    <time
                      dateTime={entry.createdAt.toISOString()}
                      className="tabular-nums"
                    >
                      {formatDateTime(entry.createdAt)}
                    </time>
                    {entry.ipAddress && (
                      <p className="font-mono text-xs text-muted-foreground">
                        {entry.ipAddress}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="min-w-36">
                    {entry.actorName ? (
                      <>
                        <p>{entry.actorName}</p>
                        {entry.actorRole && (
                          <p className="text-xs text-muted-foreground">
                            {ROLE_LABELS[entry.actorRole]}
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        Not signed in
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="min-w-40">
                    {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Subject entry={entry} viewer={user} />
                  </TableCell>
                  <TableCell className="min-w-64 text-sm">
                    <AuditChanges changes={entry.changes} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={AUDIT_PAGE_SIZE}
            hrefForPage={(page) =>
              `/audit-log${auditFiltersToQuery(filters, { page })}`
            }
          />
        </>
      )}
    </div>
  );
}
