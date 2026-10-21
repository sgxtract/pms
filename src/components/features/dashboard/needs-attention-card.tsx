import { Clock, TriangleAlert } from "lucide-react";

function AttentionStat({
  href,
  icon,
  value,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <a
      href={href}
      className="-m-3 block rounded-2xl p-3 transition-colors hover:bg-on-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-ink"
    >
      <span className="flex items-center gap-2 text-sm text-on-ink-muted">
        {icon}
        {label}
      </span>
      <span className="mt-2 block font-heading text-5xl font-semibold tracking-tight tabular-nums">
        {value}
      </span>
    </a>
  );
}

export function NeedsAttentionCard({
  overdue,
  waiting,
  staleDays,
}: {
  overdue: number;
  waiting: number;
  staleDays: number;
}) {
  const allClear = overdue === 0 && waiting === 0;

  return (
    <section aria-labelledby="needs-attention" className="h-full ink p-6">
      <h2
        id="needs-attention"
        className="text-sm font-medium text-on-ink-muted"
      >
        Needs attention
      </h2>

      {allClear ? (
        <p className="mt-4 font-heading text-2xl font-semibold">
          Everything is on track.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-6">
          <AttentionStat
            href="#section-deliveries"
            icon={<TriangleAlert aria-hidden className="size-4" />}
            value={overdue}
            label="Overdue deliveries"
          />
          <AttentionStat
            href="#section-waiting-too-long"
            icon={<Clock aria-hidden className="size-4" />}
            value={waiting}
            label={`Over ${staleDays} days in a stage`}
          />
        </div>
      )}
    </section>
  );
}
