import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime, formatPeso } from "@/lib/format";
import { requirePermission } from "@/server/auth/authorize";
import { getPrById } from "@/server/queries/procurement";

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
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("pr.view");
  const { id } = await params;
  const pr = await getPrById(id);
  if (!pr) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-sm text-muted-foreground">
          PR {pr.prNumber}
        </p>
        <h1 className="max-w-prose text-2xl font-semibold">{pr.particulars}</h1>
        <div className="flex flex-wrap gap-2">
          {pr.status === "cancelled" ? (
            <Badge tone="danger">Cancelled</Badge>
          ) : (
            <Badge tone="info">Active</Badge>
          )}
          <Badge>{pr.currentStage}</Badge>
        </div>
      </div>

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
        <Detail label="Current stage since">
          {formatDateTime(pr.currentStageAt)}
        </Detail>
      </dl>

      <p className="text-sm text-muted-foreground">
        Encoded by {pr.createdBy} on {formatDateTime(pr.createdAt)}.
      </p>
    </div>
  );
}
