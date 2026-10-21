import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { ProcurementRoute } from "@/components/features/public/procurement-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INLINE_LINK } from "@/components/ui/link-styles";
import { formatDateTime, formatPeso } from "@/lib/format";
import { SITE } from "@/lib/site-config";
import {
  getDashboardSummary,
  getStageCounts,
} from "@/server/queries/dashboard";

export const metadata: Metadata = {
  title: { absolute: `${SITE.systemName} | ${SITE.lguName}` },
  description: `Track the procurement requests of the ${SITE.lguName} from receipt to completion.`,
};

function requests(count: number) {
  return `${count} ${count === 1 ? "request" : "requests"}`;
}

export default async function HomePage() {
  const [summary, stages] = await Promise.all([
    getDashboardSummary(),
    getStageCounts(),
  ]);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:items-start lg:gap-14">
      <div className="max-w-xl space-y-8 lg:sticky lg:top-28">
        <div className="space-y-4">
          <p className="text-sm leading-snug text-foreground/75">
            {SITE.lguName}
            <br />
            {SITE.officeName}
          </p>
          <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl">
            See where every purchase request stands
          </h1>
          <p className="text-lg text-foreground/75">
            The {SITE.officeShortName} records each purchase request from the
            day it arrives until the procurement is completed. Anyone can look
            one up.
          </p>
        </div>

        <Form
          action="/procurements"
          role="search"
          aria-label="Look up a purchase request"
          className="glass glass-strong p-4 sm:p-5"
        >
          <Label htmlFor="home-q" className="block">
            Look up a purchase request
          </Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="home-q"
              name="q"
              type="search"
              placeholder="PR Number, particulars, or end-user"
              className="h-11 min-w-0 px-4 sm:flex-1"
            />
            <Button type="submit" variant="ink" size="lg">
              <Search aria-hidden />
              Search
            </Button>
          </div>
        </Form>

        <div>
          <p className="text-sm text-foreground/75">
            Under procurement right now
          </p>
          {summary.inProgress > 0 ? (
            <>
              <p className="mt-1 font-heading text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                {formatPeso(summary.inProgressAbc)}
              </p>
              <p className="mt-1 text-sm text-foreground/75">
                The combined approved budget of the{" "}
                <Link
                  href="/procurements?status=in_progress"
                  className={INLINE_LINK}
                >
                  {requests(summary.inProgress)} in progress
                </Link>
                .
              </p>
            </>
          ) : (
            <p className="mt-1 font-heading text-xl font-semibold">
              No requests are in progress.
            </p>
          )}
        </div>
      </div>

      <section aria-labelledby="route-heading" className="glass p-5 sm:p-6">
        <h2 id="route-heading" className="text-lg font-semibold">
          Where requests are now
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          As of {formatDateTime(summary.generatedAt)}. Some procurement modes
          skip stages that don&apos;t apply to them.
        </p>

        <div className="mt-5 -ml-1.5">
          <ProcurementRoute stages={stages} completed={summary.completed} />
        </div>

        {summary.cancelled > 0 && (
          <p className="mt-4 border-t border-foreground/10 pt-4 text-sm text-muted-foreground">
            {requests(summary.cancelled)} cancelled.{" "}
            <Link
              href="/procurements?status=cancelled"
              className={`text-foreground ${INLINE_LINK}`}
            >
              View cancelled
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
