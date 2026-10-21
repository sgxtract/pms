import Link from "next/link";

export function StatCard({
  label,
  value,
  description,
  href,
}: {
  label: string;
  value: string;
  description?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl px-4 py-3 transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">
        {value}
      </p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          {description}
        </p>
      )}
    </Link>
  );
}
