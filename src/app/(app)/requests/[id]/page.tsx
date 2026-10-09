import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime, formatPeso } from "@/lib/format";
import { requirePermission } from "@/server/auth/authorize";
import { MoveStagePanel } from "@/components/features/procurement/move-stage-panel";
import { StageTimeline } from "@/components/features/procurement/stage-timeline";
import { getDeliveryStatus } from "@/lib/delivery";
import { can } from "@/lib/permissions";
import {
  getActiveStages,
  getPrById,
  getStageHistory,
} from "@/server/queries/procurement";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";

export const metadata: Metadata = { title: "PR details" };

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

  const [history, stages] = await Promise.all([
    getStageHistory(pr.id),
    getActiveStages(),
  ]);

  const isOpen = pr.status === "active" && pr.currentStageCode !== "completed";
  const noticeToProceed = history.find(
    (entry) => entry.toStageCode === "notice_to_proceed",
  );
  const delivery = getDeliveryStatus({
    calendarDays: pr.calendarDays,
    noticeToProceedAt: noticeToProceed?.effectiveAt ?? null,
    isOpen,
  });

  const { saved } = await searchParams;

  return (
    <div className="space-y-8">
      <Link href="/requests" className="text-sm text-link hover:underline">
        All requests
      </Link>
      <div className="space-y-2">
        <p className="font-mono text-sm text-muted-foreground">
          PR {pr.prNumber}
        </p>
        <h1 className="max-w-prose text-2xl font-semibold">{pr.particulars}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {pr.status === "cancelled" ? (
            <Badge tone="danger">Cancelled</Badge>
          ) : (
            <Badge tone="info">Active</Badge>
          )}
          <Badge>{pr.currentStage}</Badge>
          {can(user, "pr.update") && pr.status === "active" && (
            <Link
              href={`/requests/${pr.id}/edit`}
              className={buttonClasses({
                variant: "secondary",
                size: "sm",
                className: "ml-auto",
              })}
            >
              Edit details
            </Link>
          )}
        </div>
      </div>

      {saved === "1" && (
        <div className="max-w-3xl">
          <FormMessage tone="success">Changes saved.</FormMessage>
        </div>
      )}

      <dl className="grid max-w-3xl gap-x-8 gap-y-5 rounded-lg border bg-surface p-6 sm:grid-cols-2">
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
        <Detail label="Delivery due">
          {delivery ? (
            <span className="flex flex-wrap items-center gap-2">
              {formatDate(delivery.dueAt)}
              {delivery.isOverdue && <Badge tone="warning">Overdue</Badge>}
            </span>
          ) : pr.calendarDays !== null ? (
            <span className="text-muted-foreground">
              After the Notice to Proceed
            </span>
          ) : null}
        </Detail>
        <Detail label="Current stage since">
          {formatDateTime(pr.currentStageAt)}
        </Detail>
      </dl>

      <section aria-labelledby="stage-heading" className="max-w-3xl space-y-5">
        <h2 id="stage-heading" className="text-lg font-semibold">
          Stage history
        </h2>

        {can(user, "pr.move_stage") &&
          (pr.status === "cancelled" ? (
            <p className="text-sm text-muted-foreground">
              This PR is cancelled. Restore it to move it to another stage.
            </p>
          ) : pr.currentStageCode === "completed" && !can(user, "pr.reopen") ? (
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

      <p className="text-sm text-muted-foreground">
        Encoded by {pr.createdBy} on {formatDateTime(pr.createdAt)}.
      </p>
    </div>
  );
}
