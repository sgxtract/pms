import type { Metadata } from "next";
import Link from "next/link";
import { StatCard } from "@/components/features/dashboard/stat-card";
import { buttonClasses } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { SITE } from "@/lib/site-config";
import { getDashboardSummary } from "@/server/queries/dashboard";
import { getActiveStages } from "@/server/queries/procurement";

export const metadata: Metadata = {
  title: { absolute: `${SITE.systemName} | ${SITE.lguName}` },
  description: `Track the procurement requests of the ${SITE.lguName} from receipt to completion.`,
};

export default async function HomePage() {
  const [summary, stages] = await Promise.all([
    getDashboardSummary(),
    getActiveStages(),
  ]);

  return (
    <div className="space-y-14">
      <section className="max-w-3xl space-y-5">
        <p className="text-sm font-medium text-muted-foreground">
          {SITE.lguName}, {SITE.officeName}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {SITE.systemName}
        </h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          Every procurement request is recorded from the moment the{" "}
          {SITE.officeShortName} receives it until it is completed. Anyone can
          see where each request stands.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/procurements" className={buttonClasses()}>
            View public procurement
          </Link>
          <Link
            href="/login"
            className={buttonClasses({ variant: "secondary" })}
          >
            Staff sign in
          </Link>
        </div>
      </section>

      <section aria-labelledby="figures-heading" className="space-y-4">
        <div>
          <h2 id="figures-heading" className="text-xl font-semibold">
            Procurement at a glance
          </h2>
          <p className="text-sm text-muted-foreground">
            As of {formatDateTime(summary.generatedAt)}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="In progress"
            value={String(summary.inProgress)}
            href="/procurements?status=in_progress"
          />
          <StatCard
            label="Completed"
            value={String(summary.completed)}
            href="/procurements?status=completed"
          />
          <StatCard
            label="Cancelled"
            value={String(summary.cancelled)}
            href="/procurements?status=cancelled"
          />
        </div>
      </section>

      <section aria-labelledby="stages-heading" className="max-w-3xl space-y-4">
        <div>
          <h2 id="stages-heading" className="text-xl font-semibold">
            How a request moves
          </h2>
          <p className="text-sm text-muted-foreground">
            Each request passes through these stages. Some procurement modes
            skip stages that don&apos;t apply to them.
          </p>
        </div>
        <ol className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {stages.map((stage, index) => (
            <li key={stage.code} className="flex items-baseline gap-3">
              <span className="w-6 shrink-0 text-right font-mono text-sm text-muted-foreground tabular-nums">
                {index + 1}
              </span>
              <Link
                href={`/procurements?stage=${stage.code}`}
                className="text-link hover:underline"
              >
                {stage.name}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
