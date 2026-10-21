import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MoveStagePanel } from "@/components/features/procurement/move-stage-panel";
import { PrStatusBadge } from "@/components/features/procurement/pr-status-badge";
import { PrStatusPanel } from "@/components/features/procurement/pr-status-panel";
import { StageTimeline } from "@/components/features/procurement/stage-timeline";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { getDeliveryStatus } from "@/lib/delivery";
import { formatDate, formatDateTime, formatPeso } from "@/lib/format";
import { can } from "@/lib/permissions";
import { requirePermission } from "@/server/auth/authorize";
import {
  getActiveStages,
  getPrById,
  getStageHistory,
  getStatusHistory,
} from "@/server/queries/procurement";

export const metadata: Metadata = { title: "PR details" };

const DAY_MS = 24 * 60 * 60 * 1000;

// Lives outside the component so the component body stays pure.
function wholeDaysSince(date: Date) {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / DAY_MS));
}

function timeAtStage(days: number) {
  if (days === 0) return "Less than a day at this stage";
  return days === 1 ? "1 day at this stage" : `${days} days at this stage`;
}

function Detail({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={mono ? "mt-0.5 font-mono" : "mt-0.5"}>
        {children ?? (
          <span className="text-muted-foreground">Not specified</span>
        )}
      </dd>
    </div>
  );
}

export default async function PrDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string | string[] }>;
}) {
  const user = await requirePermission("pr.view");
  const { id } = await params;
  const pr = await getPrById(id);
  if (!pr) notFound();

  const [history, stages, statusHistory] = await Promise.all([
    getStageHistory(pr.id),
    getActiveStages(),
    getStatusHistory(pr.id),
  ]);

  const isCancelled = pr.status === "cancelled";
  const isCompleted = pr.currentStageCode === "completed";
  const latestCancellation =
    isCancelled && statusHistory[0]?.action === "cancelled"
      ? statusHistory[0]
      : null;

  const isOpen = pr.status === "active" && !isCompleted;
  const noticeToProceed = history.find(
    (entry) => entry.toStageCode === "notice_to_proceed",
  );
  const delivery = getDeliveryStatus({
    calendarDays: pr.calendarDays,
    noticeToProceedAt: noticeToProceed?.effectiveAt ?? null,
    isOpen,
  });

  const stageNote = isCancelled
    ? "On hold while the PR is cancelled"
    : isCompleted
      ? null
      : timeAtStage(wholeDaysSince(new Date(pr.currentStageAt)));

  const { saved } = await searchParams;

  return (
    <div className="max-w-6xl space-y-6">
      <Link
        href="/requests"
        className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All requests
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="font-mono text-sm text-foreground/75">
            PR {pr.prNumber}
          </p>
          <h1 className="max-w-prose text-2xl font-semibold text-balance">
            {pr.particulars}
          </h1>
          <PrStatusBadge status={pr.status} stageCode={pr.currentStageCode} />
        </div>
        {can(user, "pr.update") && pr.status === "active" && (
          <Link
            href={`/requests/${pr.id}/edit`}
            className={buttonClasses({ variant: "glass", size: "sm" })}
          >
            Edit details
          </Link>
        )}
      </header>

      {isCancelled && (
        <div
          role="status"
          className="max-w-3xl rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger-soft-foreground"
        >
          <p className="font-medium">This PR is cancelled.</p>
          {latestCancellation && (
            <>
              <p className="mt-1 whitespace-pre-line">
                {latestCancellation.remarks}
              </p>
              <p className="mt-1 text-xs">
                Cancelled by {latestCancellation.actedBy} on{" "}
                {formatDateTime(latestCancellation.actedAt)}
              </p>
            </>
          )}
        </div>
      )}

      {saved === "1" && (
        <div className="max-w-3xl">
          <FormMessage tone="success">Changes saved.</FormMessage>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {/* First in the page so it's first on phones; placed right on desktop. */}
        <section
          aria-labelledby="current-stage-heading"
          className="ink p-6 text-on-ink lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1"
        >
          <h2
            id="current-stage-heading"
            className="text-sm font-medium text-on-ink-muted"
          >
            Current stage
          </h2>
          <p className="mt-2 font-heading text-2xl leading-tight font-semibold">
            {pr.currentStage}
          </p>
          <p className="mt-3 text-sm text-on-ink-muted">
            Since {formatDateTime(pr.currentStageAt)}
          </p>
          {stageNote && (
            <p className="text-sm text-on-ink-muted">{stageNote}</p>
          )}

          {(delivery || pr.calendarDays !== null) && (
            <div className="mt-5 border-t border-on-ink/15 pt-4">
              <p className="text-sm text-on-ink-muted">Delivery due</p>
              {delivery ? (
                <p className="mt-1 flex flex-wrap items-center gap-2 font-medium">
                  {formatDate(delivery.dueAt)}
                  {delivery.isOverdue && <Badge tone="warning">Overdue</Badge>}
                </p>
              ) : (
                <p className="mt-1 text-sm">After the Notice to Proceed</p>
              )}
            </div>
          )}

          <p className="mt-5 border-t border-on-ink/15 pt-4 text-xs text-on-ink-muted">
            Encoded by {pr.createdBy} on {formatDateTime(pr.createdAt)}
          </p>
        </section>

        <div className="space-y-6 lg:col-start-1 lg:row-start-1">
          <section
            aria-labelledby="details-heading"
            className="glass p-5 sm:p-6"
          >
            <h2 id="details-heading" className="text-lg font-semibold">
              Details
            </h2>
            <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <Detail label="PR Number" mono>
                {pr.prNumber}
              </Detail>
              <Detail label="PR date">{formatDate(pr.prDate)}</Detail>
              <Detail label="Reference ID" mono>
                {pr.referenceCode}
              </Detail>
              <Detail label="Type of PR">{pr.prType}</Detail>
              <Detail label="Category">{pr.category}</Detail>
              <Detail label="End-User">{pr.endUser}</Detail>
              <Detail label="ABC">
                <span className="tabular-nums">{formatPeso(pr.abc)}</span>
              </Detail>
              <Detail label="Source of Funds">{pr.sourceOfFunds}</Detail>
              <Detail label="Account Code" mono>
                {pr.accountCode}
              </Detail>
              <Detail label="Procurement Mode">{pr.procurementMode}</Detail>
              <Detail label="Calendar Days">
                {pr.calendarDays === null ? null : `${pr.calendarDays} days`}
              </Detail>
            </dl>
          </section>

          <section
            aria-labelledby="stage-heading"
            className="glass space-y-5 p-5 sm:p-6"
          >
            <h2 id="stage-heading" className="text-lg font-semibold">
              Stage history
            </h2>

            {can(user, "pr.move_stage") &&
              (isCancelled ? (
                <p className="text-sm text-muted-foreground">
                  This PR is cancelled. Restore it to move it to another stage.
                </p>
              ) : isCompleted && !can(user, "pr.reopen") ? (
                <p className="text-sm text-muted-foreground">
                  This PR is completed. Only an Administrator or Moderator can
                  reopen it.
                </p>
              ) : (
                <MoveStagePanel
                  prId={pr.id}
                  currentStage={{
                    id: pr.currentStageId,
                    code: pr.currentStageCode,
                    name: pr.currentStage,
                    sortOrder: pr.currentSortOrder,
                  }}
                  stages={stages}
                />
              ))}

            <StageTimeline entries={history} stages={stages} />
          </section>

          <section
            aria-labelledby="status-heading"
            className="glass space-y-5 p-5 sm:p-6"
          >
            <h2 id="status-heading" className="text-lg font-semibold">
              Cancellation
            </h2>

            {can(user, "pr.cancel_restore") && (
              <PrStatusPanel prId={pr.id} isCancelled={isCancelled} />
            )}

            {statusHistory.length > 0 ? (
              <ul className="divide-y divide-foreground/10">
                {statusHistory.map((entry) => (
                  <li
                    key={entry.id}
                    className="py-4 text-sm first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={entry.action === "cancelled" ? "danger" : "info"}
                      >
                        {entry.action === "cancelled"
                          ? "Cancelled"
                          : "Restored"}
                      </Badge>
                      <span className="text-muted-foreground">
                        {formatDateTime(entry.actedAt)} by {entry.actedBy}
                      </span>
                    </div>
                    <p className="mt-1 max-w-prose whitespace-pre-line">
                      {entry.remarks}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                This PR has never been cancelled.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
