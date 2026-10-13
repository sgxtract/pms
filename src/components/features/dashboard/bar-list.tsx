import Link from "next/link";

export type BarItem = {
  key: string;
  label: string;
  value: number;
  detail?: string;
  href?: string;
};

export function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            {item.href ? (
              <Link href={item.href} className="text-link hover:underline">
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
            <span className="shrink-0 tabular-nums">
              <span className="font-medium">{item.value}</span>
              {item.detail && (
                <span className="ml-2 text-muted-foreground">
                  {item.detail}
                </span>
              )}
            </span>
          </div>
          <div aria-hidden className="mt-1 h-1.5 rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
