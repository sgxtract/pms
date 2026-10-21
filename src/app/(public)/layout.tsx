import Link from "next/link";
import { GlassScene } from "@/components/features/app-shell/glass-scene";
import { Seal } from "@/components/features/brand/seal";
import { ContourScene } from "@/components/features/public/contour-scene";
import { PublicNavLink } from "@/components/features/public/public-nav-link";
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
      <GlassScene />
      <ContourScene />

      {/* Sticky needs the wrapper: glass sets position: relative on its element.
          The fade hides content scrolling through the gap above the bar. */}
      <div className="sticky top-0 z-40 bg-linear-to-b from-(--scene) from-40% to-transparent pt-3 pb-1 print:hidden">
        {/* Same width and gutters as <main>, so the bar lines up with the content. */}
        <div className="mx-auto max-w-6xl px-3 sm:px-6">
          <header className="glass flex items-center gap-2 glass-strong py-1.5 pr-1.5 pl-2 sm:gap-4 sm:pl-3">
            <Link
              href="/"
              className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Seal size={32} eager />
              <span className="hidden leading-tight md:block">
                <span className="block font-heading text-sm font-semibold">
                  {SITE.systemName}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {SITE.lguName}
                </span>
              </span>
              <span className="sr-only md:hidden">{SITE.systemName}</span>
            </Link>

            <nav aria-label="Public" className="flex min-w-0 gap-0.5">
              <PublicNavLink href="/">Home</PublicNavLink>
              <PublicNavLink href="/procurements">
                <span className="sm:hidden">Procurement</span>
                <span className="hidden sm:inline">Public procurement</span>
              </PublicNavLink>
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-1">
              <ThemeToggle />
              <Link
                href={session ? "/dashboard" : "/login"}
                className={buttonClasses({ variant: "glass", size: "sm" })}
              >
                {session ? (
                  "Dashboard"
                ) : (
                  <>
                    <span className="sm:hidden">Sign in</span>
                    <span className="hidden sm:inline">Staff sign in</span>
                  </>
                )}
              </Link>
            </div>
          </header>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
        <div className="space-y-1 border-t border-foreground/10 pt-6 text-sm text-foreground/75">
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
