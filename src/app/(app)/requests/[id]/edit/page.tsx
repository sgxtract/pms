import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditPrForm } from "@/components/features/procurement/edit-pr-form";
import { todayInManila } from "@/lib/dates";
import { requirePermission } from "@/server/auth/authorize";
import {
  getPrById,
  getPrFormOptions,
  getPrSuggestions,
} from "@/server/queries/procurement";

export const metadata: Metadata = { title: "Edit PR" };

export default async function EditPrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("pr.update");
  const { id } = await params;
  const pr = await getPrById(id);
  if (!pr) notFound();

  const header = (
    <div>
      <Link
        href={`/requests/${pr.id}`}
        className="text-sm text-link hover:underline"
      >
        Back to PR {pr.prNumber}
      </Link>
      <h1 className="mt-1 text-2xl font-semibold">Edit PR details</h1>
    </div>
  );

  if (pr.status === "cancelled") {
    return (
      <div className="space-y-4">
        {header}
        <p className="text-muted-foreground">
          This PR is cancelled. Restore it before editing its details.
        </p>
      </div>
    );
  }

  const [options, suggestions] = await Promise.all([
    getPrFormOptions({
      typeId: pr.prTypeId,
      categoryId: pr.prCategoryId,
      modeId: pr.procurementModeId,
    }),
    getPrSuggestions(),
  ]);

  return (
    <div className="space-y-8">
      {header}
      <EditPrForm
        key={pr.version}
        prId={pr.id}
        version={pr.version}
        defaults={{
          prNumber: pr.prNumber,
          prDate: pr.prDate,
          referenceCode: pr.referenceCode,
          prTypeId: pr.prTypeId,
          prCategoryId: pr.prCategoryId,
          endUser: pr.endUser,
          particulars: pr.particulars,
          abc: pr.abc,
          sourceOfFunds: pr.sourceOfFunds,
          procurementModeId: pr.procurementModeId,
          calendarDays: pr.calendarDays,
          accountCode: pr.accountCode,
        }}
        options={options}
        suggestions={suggestions}
        today={todayInManila()}
      />
    </div>
  );
}
