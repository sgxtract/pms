import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-semibold">Procurement Monitoring System</h1>
      <p className="mt-2 text-muted-foreground">
        The home page will be built in a later lesson.
      </p>
      <Link
        href="/styleguide"
        className="mt-6 inline-block text-link underline-offset-4 hover:underline"
      >
        Open the design system preview
      </Link>
    </main>
  );
}
