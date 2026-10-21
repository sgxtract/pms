import type { Metadata } from "next";
import { SignatoriesForm } from "@/components/features/settings/signatories-form";
import { toSignatoriesForm } from "@/lib/validation/settings";
import { requirePermission } from "@/server/auth/authorize";
import { getReportSignatories } from "@/server/queries/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requirePermission("settings.manage");
  const signatories = await getReportSignatories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-foreground/75">
          Changes are recorded in the audit log.
        </p>
      </div>

      <section
        aria-labelledby="signatories-heading"
        className="glass max-w-3xl space-y-6 p-5 sm:p-6"
      >
        <div>
          <h2 id="signatories-heading" className="text-lg font-semibold">
            Report signatories
          </h2>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Printed at the bottom of every report. Leave a name blank to print
            an empty line for signing by hand.
          </p>
        </div>
        <SignatoriesForm defaults={toSignatoriesForm(signatories)} />
      </section>
    </div>
  );
}
