import Link from "next/link";
import { TEXT_LINK } from "@/components/ui/link-styles";

export function DashboardSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  const id = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section aria-labelledby={id} className="glass p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id={id} className="font-semibold">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          <Link href={action.href} className={`text-sm ${TEXT_LINK}`}>
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
