import Link from "next/link";

export type BarItem = {
  key: string;
  label: string;
  value: number;
  detail?: string;
  href?: string;
};

function BarRow({ item, max }: { item: BarItem; max: number }) {
  const content = (
    <>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate">{item.label}</span>
        <span className="shrink-0 tabular-nums">
          <span className="font-medium">{item.value}</span>
          {item.detail && (
            <span className="ml-2 text-muted-foreground">{item.detail}</span>
          )}
        </span>
      </div>
      <div aria-hidden className="mt-2 h-1 rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-ink"
          style={{ width: `${(item.value / max) * 100}%` }}
        />
      </div>
    </>
  );

  if (!item.href) return <div className="py-2">{content}</div>;

  return (
    <Link
      href={item.href}
      className="-mx-3 block rounded-xl px-3 py-2 transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {content}
    </Link>
  );
}

export function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ul>
      {items.map((item) => (
        <li key={item.key}>
          <BarRow item={item} max={max} />
        </li>
      ))}
    </ul>
  );
}
