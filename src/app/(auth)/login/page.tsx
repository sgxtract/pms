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
    <main className="relative grid min-h-svh place-items-center bg-neu px-4 py-12 sm:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="grid w-full max-w-4xl gap-2 rounded-4xl bg-neu p-3 neu-raised md:grid-cols-[1.1fr_1fr] md:p-4">
        {/* The form comes first in the page, so it's first on mobile and for keyboards. */}
        <section
          aria-labelledby="sign-in-heading"
          className="flex flex-col justify-center p-5 sm:p-8 md:p-10"
        >
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <span className="inline-grid rounded-full bg-neu p-1.5 neu-raised-sm">
              <Seal size={44} eager />
            </span>
            <div className="leading-tight">
              <p className="text-xs text-neu-muted">{SITE.lguName}</p>
              <p className="font-heading font-semibold">{SITE.systemName}</p>
            </div>
          </div>

          <h1 id="sign-in-heading" className="text-2xl font-semibold">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-neu-muted">
            Use your Employee ID and password.
          </p>

          {reason === "timeout" && (
            <p
              role="status"
              className="mt-6 rounded-xl bg-neu px-4 py-3 text-sm text-info-soft-foreground neu-inset"
            >
              You were signed out after {IDLE_TIMEOUT_SECONDS / 60} minutes of
              inactivity. Sign in again to continue.
            </p>
          )}

          <LoginForm />

          <p className="mt-8 text-sm text-neu-muted">
            Accounts are created by the system administrator. Contact them if
            you need access or have forgotten your password.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm text-link hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to home
          </Link>
        </section>

        {/* Shown on the left on wider screens. */}
        <section
          aria-labelledby="about-heading"
          className="rounded-3xl bg-neu p-6 neu-inset sm:p-8 md:order-first md:p-10"
        >
          <div className="hidden md:block">
            <span className="inline-grid rounded-full bg-neu p-2 neu-raised-sm">
              <Seal size={72} eager />
            </span>
            <p className="mt-6 text-sm font-medium text-neu-muted">
              {SITE.lguName}
            </p>
            <p className="text-sm text-neu-muted">{SITE.officeName}</p>
          </div>

          <h2
            id="about-heading"
            className="font-heading text-xl font-semibold md:mt-4 md:text-3xl"
          >
            <span className="md:hidden">About the system</span>
            <span className="hidden md:inline">{SITE.systemName}</span>
          </h2>
          <p className="mt-3 max-w-prose text-sm text-neu-muted md:text-base">
            Procurement requests of the {SITE.officeShortName}, tracked from the
            moment they&apos;re received until they&apos;re completed.
          </p>

          <ul className="mt-8 space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-neu text-link neu-raised-sm [&_svg]:size-5">
                  {item.icon}
                </span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-neu-muted">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/procurements"
            className="mt-8 inline-flex rounded-xl bg-neu px-4 py-2.5 text-sm font-medium text-link neu-raised-sm transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:neu-pressed"
          >
            View public procurement
          </Link>
        </section>
      </div>
    </main>
  );
}
