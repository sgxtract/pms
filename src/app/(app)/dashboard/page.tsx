import type { Metadata } from "next";
import Link from "next/link";
import { BarList } from "@/components/features/dashboard/bar-list";
import { DashboardSection } from "@/components/features/dashboard/dashboard-section";
import { StatCard } from "@/components/features/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { AUDIT_ACTION_LABELS } from "@/lib/audit-labels";
import {
  DELIVERY_DUE_SOON_DAYS,
  RECENT_ACTIVITY_LIMIT,
  STALE_STAGE_DAYS,
} from "@/lib/dashboard-config";
import { formatDate, formatDateTime, formatPeso } from "@/lib/format";
import { auditScope, can } from "@/lib/permissions";
import { requireUser } from "@/server/auth/session";
import { listRecentAuditLogs } from "@/server/queries/audit";
import {
  getDashboardSummary,
  getModeSummary,
  getStageCounts,
  getUpcomingDeliveries,
  getWaitingPrs,
} from "@/server/queries/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export default async function DashboardPage() {
  const user = await requireUser();

  const [summary, stages, modes, deliveries, waiting, activity] =
    await Promise.all([
      getDashboardSummary(),
      getStageCounts(),
      getModeSummary(),
      getUpcomingDeliveries(),
      getWaitingPrs(),
      listRecentAuditLogs(auditScope(user), user.id, RECENT_ACTIVITY_LIMIT),
    ]);

  const totalWaiting = waiting[0]?.totalWaiting ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            As of {formatDateTime(summary.generatedAt)}
          </p>
        </div>
        {can(user, "pr.create") && (
          <Link href="/requests/new" className={buttonClasses()}>
            New PR
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total PRs"
          value={String(summary.total)}
          href="/requests"
        />
        <StatCard
          label="In progress"
          value={String(summary.inProgress)}
          description={`${formatPeso(summary.inProgressAbc)} total ABC`}
          href="/requests?status=in_progress"
        />
        <StatCard
          label="Completed"
          value={String(summary.completed)}
          href="/requests?status=completed"
        />
        <StatCard
          label="Cancelled"
          value={String(summary.cancelled)}
          href="/requests?status=cancelled"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <DashboardSection
          title="In progress by stage"
          description="Where active PRs are now."
        >
          <BarList
            items={stages.map((stage) => ({
              key: stage.code,
              label: stage.name,
              value: stage.count,
              href: `/requests?status=in_progress&stage=${stage.code}`,
            }))}
          />
        </DashboardSection>

        <DashboardSection title="In progress by procurement mode">
          {modes.length === 0 ? (
            <EmptyNote>No PRs in progress.</EmptyNote>
          ) : (
            <BarList
              items={modes.map((mode) => ({
                key: mode.id ?? "none",
                label: mode.name,
                value: mode.count,
                detail: formatPeso(mode.totalAbc),
                href: mode.id
                  ? `/requests?status=in_progress&mode=${mode.id}`
                  : undefined,
              }))}
            />
          )}
        </DashboardSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardSection
          title="Deliveries"
          description={`Overdue, or due within ${DELIVERY_DUE_SOON_DAYS} days.`}
        >
          {deliveries.length === 0 ? (
            <EmptyNote>No deliveries are overdue or due soon.</EmptyNote>
          ) : (
            <ul className="divide-y">
              {deliveries.map((delivery) => (
                <li
                  key={delivery.id}
                  className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/requests/${delivery.id}`}
                      className="font-mono text-sm text-link hover:underline"
                    >
                      {delivery.prNumber}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">
                      {delivery.particulars}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    {delivery.isOverdue ? (
                      <Badge tone="warning">Overdue</Badge>
                    ) : (
                      <span className="tabular-nums">
                        Due in {plural(Math.max(delivery.daysLeft, 1), "day")}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatDate(delivery.dueAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection
          title="Waiting too long"
          description={
            totalWaiting > waiting.length
              ? `In the same stage for over ${STALE_STAGE_DAYS} days. Showing the ${waiting.length} longest of ${totalWaiting}.`
              : `In the same stage for over ${STALE_STAGE_DAYS} days.`
          }
        >
          {waiting.length === 0 ? (
            <EmptyNote>
              No PR has been in its stage for over {STALE_STAGE_DAYS} days.
            </EmptyNote>
          ) : (
            <ul className="divide-y">
              {waiting.map((pr) => (
                <li
                  key={pr.id}
                  className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/requests/${pr.id}`}
                      className="font-mono text-sm text-link hover:underline"
                    >
                      {pr.prNumber}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">
                      {pr.particulars}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className="tabular-nums">
                      {plural(pr.daysInStage, "day")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pr.stageName}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>
      </div>

      <DashboardSection
        title="Recent activity"
        action={{ href: "/audit-log", label: "View audit log" }}
      >
        {activity.length === 0 ? (
          <EmptyNote>No activity recorded yet.</EmptyNote>
        ) : (
          <ul className="divide-y">
            {activity.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 text-sm first:pt-0 last:pb-0"
              >
                <p>
                  <span className="font-medium">
                    {entry.actorName ?? "Not signed in"}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {(
                      AUDIT_ACTION_LABELS[entry.action] ?? entry.action
                    ).toLowerCase()}
                  </span>
                  {entry.entityType === "procurement_request" &&
                    entry.entityId && (
                      <>
                        {" "}
                        <Link
                          href={`/requests/${entry.entityId}`}
                          className="font-mono text-link hover:underline"
                        >
                          {entry.subjectPrNumber ?? entry.entityId}
                        </Link>
                      </>
                    )}
                </p>
                <time
                  dateTime={entry.createdAt.toISOString()}
                  className="text-xs text-muted-foreground tabular-nums"
                >
                  {formatDateTime(entry.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}
