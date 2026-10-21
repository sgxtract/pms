import type { Metadata } from "next";
import Link from "next/link";
import { AuditChanges } from "@/components/features/audit/audit-changes";
import { AuditFilterBar } from "@/components/features/audit/audit-filter-bar";
import { INLINE_LINK } from "@/components/ui/link-styles";
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
        className={`font-mono ${INLINE_LINK}`}
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
      <Link href={`/users/${entry.subjectUserId}`} className={INLINE_LINK}>
        {label}
      </Link>
    ) : (
      label
    );
  }

  if (entry.entityType === "setting") {
    return (
      <span>
        {entry.entityId === "report_signatories"
          ? "Report signatories"
          : entry.entityId}
      </span>
    );
  }

  return <span className="text-muted-foreground">None</span>;
}

function Who({ entry }: { entry: AuditLogEntry }) {
  if (!entry.actorName) {
    return <span className="text-muted-foreground">Not signed in</span>;
  }
  return (
    <>
      <p>{entry.actorName}</p>
      {entry.actorRole && (
        <p className="text-xs text-muted-foreground">
          {ROLE_LABELS[entry.actorRole]}
        </p>
      )}
    </>
  );
}

function When({ entry }: { entry: AuditLogEntry }) {
  return (
    <>
      <time dateTime={entry.createdAt.toISOString()} className="tabular-nums">
        {formatDateTime(entry.createdAt)}
      </time>
      {entry.ipAddress && (
        <p className="font-mono text-xs text-muted-foreground">
          {entry.ipAddress}
        </p>
      )}
    </>
  );
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
        <p className="mt-1 text-sm text-foreground/75">
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
        <div className="glass px-6 py-12 text-center">
          <p className="font-medium">
            {hasActiveAuditFilters(filters)
              ? "No activity matches these filters."
              : "No activity recorded yet."}
          </p>
        </div>
      ) : (
        <section
          aria-label="Recorded activity"
          className="glass overflow-hidden"
        >
          {/* Below lg: one stacked entry per event instead of a 5-column table. */}
          <ul className="divide-y divide-foreground/10 lg:hidden">
            {result.rows.map((entry) => (
              <li key={entry.id} className="space-y-2 px-4 py-3.5 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-medium">
                    {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <When entry={entry} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Who</p>
                    <Who entry={entry} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Subject</p>
                    <Subject entry={entry} viewer={user} />
                  </div>
                </div>
                <AuditChanges changes={entry.changes} />
              </li>
            ))}
          </ul>

          <div className="hidden lg:block">
            <Table framed={false}>
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
                  <TableRow key={entry.id} className="[&>td]:align-top">
                    <TableCell className="whitespace-nowrap">
                      <When entry={entry} />
                    </TableCell>
                    <TableCell className="min-w-36">
                      <Who entry={entry} />
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
          </div>

          <div className="border-t border-foreground/10 px-4 py-3">
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              pageSize={AUDIT_PAGE_SIZE}
              hrefForPage={(page) =>
                `/audit-log${auditFiltersToQuery(filters, { page })}`
              }
            />
          </div>
        </section>
      )}
    </div>
  );
}
