import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { todayInManila } from "@/lib/dates";
import { SITE } from "@/lib/site-config";
import { getCurrentSession } from "@/server/auth/session";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
          <Link href="/" className="leading-tight">
            <span className="block text-xs text-muted-foreground">
              {SITE.lguName}
            </span>
            <span className="block font-heading font-semibold">
              {SITE.systemName}
            </span>
          </Link>

          <nav aria-label="Public" className="flex gap-1 text-sm">
            <Link
              href="/"
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/procurements"
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground"
            >
              Public procurement
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={session ? "/dashboard" : "/login"}
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              {session ? "Go to dashboard" : "Staff sign in"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {children}
      </main>

      <footer className="border-t bg-surface">
        <div className="mx-auto max-w-6xl space-y-1 px-6 py-6 text-sm text-muted-foreground">
          <p>
            {SITE.lguName}, {SITE.officeName} ({SITE.officeShortName})
          </p>
          <p>
            © {todayInManila().slice(0, 4)}. Information is updated as each PR
            moves through the procurement process.
          </p>
        </div>
      </footer>
    </div>
  );
}
