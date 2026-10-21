import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
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
    <>
      <BackLink href={`/requests/${pr.id}`}>Back to PR {pr.prNumber}</BackLink>
      <div>
        <p className="font-mono text-sm text-foreground/75">PR {pr.prNumber}</p>
        <h1 className="mt-1 text-2xl font-semibold">Edit PR details</h1>
      </div>
    </>
  );

  if (pr.status === "cancelled") {
    return (
      <div className="space-y-6">
        {header}
        <div className="glass max-w-3xl px-6 py-10 text-center">
          <p className="font-medium">This PR is cancelled.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Restore it before editing its details.
          </p>
        </div>
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
    <div className="space-y-6">
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
