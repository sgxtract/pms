import { ArrowLeft, Globe, ShieldCheck, Workflow } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/features/auth/login-form";
import { Seal } from "@/components/features/brand/seal";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { IDLE_TIMEOUT_SECONDS } from "@/lib/auth-config";
import { SITE } from "@/lib/site-config";
import { getCurrentSession } from "@/server/auth/session";
import { GlassScene } from "@/components/features/app-shell/glass-scene";

export const metadata: Metadata = { title: "Sign in" };

const HIGHLIGHTS = [
  {
    icon: <Workflow aria-hidden />,
    title: "Every stage, on record",
    text: "Each PR is tracked from receipt to completion, with who moved it and when.",
  },
  {
    icon: <ShieldCheck aria-hidden />,
    title: "Accountable by design",
    text: "Every change is kept in an audit log that can't be altered.",
  },
  {
    icon: <Globe aria-hidden />,
    title: "Open to the public",
    text: "Anyone can see where each procurement request stands.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string | string[] }>;
}) {
  const session = await getCurrentSession();
  if (session) redirect("/dashboard");

  const { reason } = await searchParams;

  return (
    <main className="relative grid min-h-svh place-items-center px-4 pt-20 pb-12 sm:px-8 md:py-12">
      <GlassScene />

      <div className="absolute top-4 right-4 z-10">
        <div className="glass p-1">
          <ThemeToggle />
        </div>
      </div>

      <div className="glass grid w-full max-w-4xl gap-3 glass-strong p-3 md:grid-cols-[1.1fr_1fr]">
        {/* The form comes first in the page, so it's first on mobile and for keyboards. */}
        <section
          aria-labelledby="sign-in-heading"
          className="flex flex-col justify-center p-5 sm:p-8 md:p-10"
        >
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <Seal size={44} eager />
            <div className="leading-tight">
              <p className="text-xs text-muted-foreground">{SITE.lguName}</p>
              <p className="font-heading font-semibold">{SITE.systemName}</p>
            </div>
          </div>

          <h1 id="sign-in-heading" className="text-2xl font-semibold">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your Employee ID and password.
          </p>

          {reason === "timeout" && (
            <p
              role="status"
              className="mt-6 rounded-xl bg-info-soft px-4 py-3 text-sm text-info-soft-foreground"
            >
              You were signed out after {IDLE_TIMEOUT_SECONDS / 60} minutes of
              inactivity. Sign in again to continue.
            </p>
          )}

          <LoginForm />

          <p className="mt-8 text-sm text-muted-foreground">
            Accounts are created by the system administrator. Contact them if
            you need access or have forgotten your password.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-md text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to home
          </Link>
        </section>

        {/* Shown on the left on wider screens. */}
        <section
          aria-labelledby="about-heading"
          className="rounded-xl bg-ink bg-[radial-gradient(120%_80%_at_0%_0%,var(--ink-2),var(--ink))] p-6 text-on-ink sm:p-8 md:order-first md:p-10"
        >
          <div className="hidden md:block">
            <Seal size={72} eager />
            <p className="mt-6 text-sm font-medium text-on-ink-muted">
              {SITE.lguName}
            </p>
            <p className="text-sm text-on-ink-muted">{SITE.officeName}</p>
          </div>

          <h2
            id="about-heading"
            className="font-heading text-xl font-semibold md:mt-4 md:text-3xl"
          >
            <span className="md:hidden">About the system</span>
            <span className="hidden md:inline">{SITE.systemName}</span>
          </h2>
          <p className="mt-3 max-w-prose text-sm text-on-ink-muted md:text-base">
            Procurement requests of the {SITE.officeShortName}, tracked from the
            moment they&apos;re received until they&apos;re completed.
          </p>

          <ul className="mt-8 space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-on-ink/10 [&_svg]:size-5">
                  {item.icon}
                </span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-on-ink-muted">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/procurements"
            className="mt-8 inline-flex rounded-full border border-on-ink/25 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-on-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-ink"
          >
            View public procurement
          </Link>
        </section>
      </div>
    </main>
  );
}
