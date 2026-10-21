import type { Metadata } from "next";
import { BackLink } from "@/components/ui/back-link";
import { CreatePrForm } from "@/components/features/procurement/create-pr-form";
import { nowForDateTimeInput, todayInManila } from "@/lib/dates";
import { requirePermission } from "@/server/auth/authorize";
import {
  getPrFormOptions,
  getPrSuggestions,
} from "@/server/queries/procurement";

export const metadata: Metadata = { title: "New PR" };

export default async function NewPrPage() {
  await requirePermission("pr.create");
  const [options, suggestions] = await Promise.all([
    getPrFormOptions(),
    getPrSuggestions(),
  ]);

  return (
    <div className="space-y-6">
      <BackLink href="/requests">All requests</BackLink>
      <div>
        <h1 className="text-2xl font-semibold">New PR</h1>
        <p className="mt-1 max-w-prose text-sm text-foreground/75">
          The PR starts at the Received stage. All fields can be edited later.
        </p>
      </div>
      <CreatePrForm
        options={options}
        suggestions={suggestions}
        today={todayInManila()}
        defaultReceivedAt={nowForDateTimeInput()}
      />
    </div>
  );
}
