import type { Metadata } from "next";
import { Plus, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata: Metadata = { title: "Design system" };

const pesos = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export default function StyleguidePage() {
  return (
    <main className="mx-auto max-w-4xl space-y-10 px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Design system</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Development preview of the building blocks used across PMS.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Typography</h2>
        <div className="glass space-y-4 p-6">
          <p className="font-heading text-3xl font-semibold tracking-tight">
            Procurement Monitoring System
          </p>
          <p className="max-w-prose">
            Body text is set in Inter. Headings use Public Sans, a typeface
            designed for government interfaces.
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">PR Number</dt>
            <dd className="font-mono">2026091231-A</dd>
            <dt className="text-muted-foreground">Reference ID</dt>
            <dd className="font-mono">GO-26-09-097</dd>
            <dt className="text-muted-foreground">ABC</dt>
            <dd className="tabular-nums">{pesos.format(1250000)}</dd>
          </dl>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Buttons</h2>
        <div className="glass flex flex-wrap items-center gap-3 p-6">
          <Button variant="ink">
            <Plus /> New PR
          </Button>
          <Button variant="glass">
            <Printer /> Print report
          </Button>
          <Button variant="ghost">View history</Button>
          <Button variant="danger">Cancel PR</Button>
          <Button size="sm" variant="glass">
            Small
          </Button>
          <Button variant="glass" disabled>
            Disabled
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Badges</h2>
        <div className="glass flex flex-wrap items-center gap-3 p-6">
          <Badge tone="info">In progress</Badge>
          <Badge tone="success">Completed</Badge>
          <Badge tone="warning">Overdue</Badge>
          <Badge tone="danger">Cancelled</Badge>
          <Badge>Pre-Procurement</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 ink p-6">
          <span className="text-sm text-on-ink-muted">On ink:</span>
          <Badge tone="info">In progress</Badge>
          <Badge tone="success">Completed</Badge>
          <Badge tone="warning">Overdue</Badge>
          <Badge tone="danger">Cancelled</Badge>
          <Badge>Pre-Procurement</Badge>
        </div>
      </section>
    </main>
  );
}
