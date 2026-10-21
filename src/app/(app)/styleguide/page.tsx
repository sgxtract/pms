import type { Metadata } from "next";
import { Copy, Plus, Printer } from "lucide-react";
import { ProcurementRoute } from "@/components/features/public/procurement-route";
import { PrStatusBadge } from "@/components/features/procurement/pr-status-badge";
import { BackLink } from "@/components/ui/back-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { INLINE_LINK, TEXT_LINK } from "@/components/ui/link-styles";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { formatPeso } from "@/lib/format";

export const metadata: Metadata = { title: "Design system" };

const SECTIONS = [
  { id: "principles", label: "Principles" },
  { id: "colour", label: "Colour" },
  { id: "surfaces", label: "Surfaces" },
  { id: "type", label: "Type" },
  { id: "buttons", label: "Buttons" },
  { id: "fields", label: "Fields" },
  { id: "badges", label: "Badges" },
  { id: "links", label: "Links" },
  { id: "tables", label: "Tables" },
  { id: "route", label: "Procurement route" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const PRINCIPLES = [
  {
    title: "One glass panel per section",
    body: "Glass never sits inside glass. A panel's blur only sees what is behind the panel, so a nested panel would blur nothing and look flat. Divide a panel with hairlines instead.",
  },
  {
    title: "Two ink elements at most",
    body: "Ink marks the page's main action and one key figure or notice, such as a temporary password. Everything else is glass.",
  },
  {
    title: "Colour only where it means something",
    body: "Tone dots mark status and blue is kept for focus rings. Links are the text colour with an underline.",
  },
  {
    title: "Words carry the meaning",
    body: "A badge's word states the status and its dot helps scanning. Nothing relies on colour alone.",
  },
  {
    title: "Muted text belongs on glass",
    body: "Text sitting directly on the scene uses foreground at 75%. The muted grey only has enough contrast on a panel.",
  },
  {
    title: "Paper is plain",
    body: "When printed, the scene disappears and glass and ink become white cards with a thin border.",
  },
];

const COLOURS: {
  group: string;
  swatches: { token: string; name: string; role: string }[];
}[] = [
  {
    group: "Scene",
    swatches: [
      { token: "--scene", name: "Scene", role: "Matte base behind everything" },
      {
        token: "--scene-form-1",
        name: "Scene form",
        role: "Soft shapes the glass blurs",
      },
      {
        token: "--scene-form-2",
        name: "Scene light",
        role: "The bright shape at the top",
      },
    ],
  },
  {
    group: "Glass",
    swatches: [
      { token: "--glass", name: "Glass", role: "Panels, translucent" },
      {
        token: "--glass-strong",
        name: "Glass strong",
        role: "Bars, forms, dialogs",
      },
      {
        token: "--glass-solid",
        name: "Glass solid",
        role: "Fallback, menus, autofill",
      },
      {
        token: "--glass-edge",
        name: "Glass edge",
        role: "Field and button borders, 3:1",
      },
      {
        token: "--glass-muted",
        name: "Glass muted",
        role: "Secondary text on glass",
      },
    ],
  },
  {
    group: "Ink",
    swatches: [
      { token: "--ink", name: "Ink", role: "Main action, key figure" },
      { token: "--on-ink", name: "On ink", role: "Text on ink" },
      {
        token: "--on-ink-muted",
        name: "On ink muted",
        role: "Secondary text on ink",
      },
    ],
  },
  {
    group: "Text and focus",
    swatches: [
      { token: "--foreground", name: "Foreground", role: "Text, rules at 10%" },
      { token: "--ring", name: "Ring", role: "Keyboard focus only" },
    ],
  },
  {
    group: "Status dots",
    swatches: [
      { token: "--tone-info", name: "Info", role: "In progress" },
      { token: "--tone-success", name: "Success", role: "Completed, active" },
      { token: "--tone-warning", name: "Warning", role: "Overdue, waiting" },
      { token: "--tone-danger", name: "Danger", role: "Cancelled, errors" },
    ],
  },
];

const TYPE_SCALE = [
  {
    role: "Display",
    classes: "text-4xl font-semibold tracking-tight",
    sample: (
      <p className="font-heading text-4xl leading-tight font-semibold tracking-tight">
        See where every purchase request stands
      </p>
    ),
  },
  {
    role: "Page title",
    classes: "text-2xl font-semibold",
    sample: <p className="font-heading text-2xl font-semibold">Requests</p>,
  },
  {
    role: "Section title",
    classes: "text-lg font-semibold",
    sample: (
      <p className="font-heading text-lg font-semibold">
        Where requests are now
      </p>
    ),
  },
  {
    role: "Body",
    classes: "text-base",
    sample: (
      <p className="max-w-prose">
        Body text is Inter. Headings are Public Sans, a typeface made for
        government interfaces.
      </p>
    ),
  },
  {
    role: "Small",
    classes: "text-sm text-muted-foreground",
    sample: (
      <p className="text-sm text-muted-foreground">
        As of Oct 21, 2026, 9:41 PM.
      </p>
    ),
  },
  {
    role: "Figure",
    classes: "font-heading text-3xl tabular-nums",
    sample: (
      <p className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
        {formatPeso(1250000)}
      </p>
    ),
  },
  {
    role: "Codes",
    classes: "font-mono",
    sample: (
      <p className="font-mono">
        2026091231-A <span className="text-muted-foreground">and</span>{" "}
        GO-26-09-097
      </p>
    ),
  },
];

const SAMPLE_ROWS = [
  {
    prNumber: "2026091231-A",
    particulars: "Supply of medicines for the Provincial Hospital",
    abc: 1250000,
    stage: "Evaluation",
    status: "active" as const,
    stageCode: "evaluation",
  },
  {
    prNumber: "2026091188",
    particulars: "Office supplies, second quarter",
    abc: 184500,
    stage: "Completed",
    status: "active" as const,
    stageCode: "completed",
  },
  {
    prNumber: "2026090940",
    particulars: "Repair of the Capitol perimeter fence",
    abc: 960000,
    stage: "Posting",
    status: "cancelled" as const,
    stageCode: "posting",
  },
];

const SAMPLE_ROUTE = [
  { code: "received", name: "Received", count: 4 },
  { code: "pre_procurement", name: "Pre-Procurement", count: 2 },
  { code: "posting", name: "Posting", count: 0 },
  { code: "pre_bid", name: "Pre-Bid", count: 1 },
  { code: "opening", name: "Opening", count: 0 },
  { code: "evaluation", name: "Evaluation", count: 6 },
  { code: "post_qualification", name: "Post-Qualification", count: 0 },
  {
    code: "notice_of_post_qualification",
    name: "Notice of Post-Qualification",
    count: 0,
  },
  { code: "notice_of_award", name: "Notice of Award", count: 3 },
  { code: "notice_to_proceed", name: "Notice to Proceed", count: 12 },
];

function Section({
  id,
  title,
  rule,
  children,
}: {
  id: SectionId;
  title: string;
  rule: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-24 space-y-4"
    >
      <div>
        <h2 id={`${id}-heading`} className="text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-1 max-w-prose text-sm text-foreground/75">{rule}</p>
      </div>
      {children}
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-foreground/5 px-1.5 py-0.5 font-mono text-xs">
      {children}
    </code>
  );
}

export default function StyleguidePage() {
  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Design system</h1>
          <p className="mt-1 max-w-prose text-sm text-foreground/75">
            Monochrome Frost: the parts every PMS page is built from, and the
            rules for putting them together. Switch the theme to check both.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="grid gap-10 lg:grid-cols-[10rem_minmax(0,1fr)]">
        <nav
          aria-label="Design system sections"
          className="hidden lg:block print:hidden"
        >
          <ul className="sticky top-8 space-y-1.5 text-sm">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={`text-foreground/75 hover:text-foreground ${TEXT_LINK}`}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-14">
          <Section
            id="principles"
            title="Principles"
            rule="Every page decision comes back to these six rules."
          >
            <dl className="glass grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
              {PRINCIPLES.map((principle) => (
                <div key={principle.title}>
                  <dt className="font-medium">{principle.title}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {principle.body}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section
            id="colour"
            title="Colour"
            rule="Tokens live in globals.css and flip for dark mode. Use the Tailwind names (bg-ink, text-on-ink, border-glass-edge), not raw values."
          >
            <div className="glass space-y-6 p-5 sm:p-6">
              {COLOURS.map((group) => (
                <div key={group.group}>
                  <h3 className="text-sm font-medium">{group.group}</h3>
                  <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                    {group.swatches.map((swatch) => (
                      <li key={swatch.token}>
                        <div
                          aria-hidden
                          className="h-14 rounded-xl ring-1 ring-foreground/10 ring-inset"
                          style={{ background: `var(${swatch.token})` }}
                        />
                        <p className="mt-2 text-sm font-medium">
                          {swatch.name}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {swatch.token}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {swatch.role}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="surfaces"
            title="Surfaces"
            rule="Three surfaces, all on the scene. Panels are rounded 1.5rem, fields 0.75rem, buttons and badges fully round."
          >
            {/* A small scene of its own, so the glass samples have something
                to blur. It isn't glass, so nothing here is nested glass. */}
            <div className="grid gap-4 rounded-3xl p-4 ring-1 ring-foreground/10 glass-scene ring-inset sm:grid-cols-3 sm:p-6">
              <div className="glass p-5">
                <p className="font-medium">Glass</p>
                <p className="mt-1">
                  <Code>glass</Code>
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  The default panel: lists, tables, sections of a page.
                </p>
              </div>
              <div className="glass glass-strong p-5">
                <p className="font-medium">Glass strong</p>
                <p className="mt-1">
                  <Code>glass glass-strong</Code>
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  More opaque, for things people type into or that float: forms,
                  filters, the top bar, dialogs.
                </p>
              </div>
              <div className="ink p-5">
                <p className="font-medium">Ink</p>
                <p className="mt-1">
                  <code className="rounded-md bg-on-ink/10 px-1.5 py-0.5 font-mono text-xs">
                    ink
                  </code>
                </p>
                <p className="mt-3 text-sm text-on-ink-muted">
                  Solid and inverted. The one figure or notice that must not be
                  missed.
                </p>
              </div>
            </div>
          </Section>

          <Section
            id="type"
            title="Type"
            rule="Public Sans for headings and figures, Inter for everything else, JetBrains Mono for PR numbers and codes. Money always uses tabular figures."
          >
            <dl className="glass divide-y divide-foreground/10 px-5 sm:px-6">
              {TYPE_SCALE.map((step) => (
                <div
                  key={step.role}
                  className="grid gap-2 py-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-baseline sm:gap-6"
                >
                  <dt>
                    <p className="text-sm font-medium">{step.role}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {step.classes}
                    </p>
                  </dt>
                  <dd className="min-w-0">{step.sample}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section
            id="buttons"
            title="Buttons"
            rule="Name the action: Save changes, Create PR, Print report. Ink for the main action, glass for the rest, ghost for quiet actions in lists and bars, danger only when something is undone or cancelled."
          >
            <div className="glass space-y-6 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="ink">
                  <Plus aria-hidden /> New PR
                </Button>
                <Button variant="glass">
                  <Printer aria-hidden /> Print report
                </Button>
                <Button variant="ghost">View history</Button>
                <Button variant="danger">Cancel PR</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-foreground/10 pt-6">
                <Button variant="glass" size="sm">
                  Small
                </Button>
                <Button variant="glass">Medium</Button>
                <Button variant="ink" size="lg">
                  Large, for forms
                </Button>
                <Button variant="glass" disabled>
                  Disabled
                </Button>
                <ThemeToggle />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 ink p-5 sm:p-6">
              <div>
                <p className="text-sm text-on-ink-muted">Temporary password</p>
                <p className="font-mono text-xl tracking-wide">kD7-mQ2-vX9</p>
              </div>
              <Button variant="on-ink" size="sm">
                <Copy aria-hidden /> Copy
              </Button>
            </div>
          </Section>

          <Section
            id="fields"
            title="Fields"
            rule="Input, Select and Textarea are glass by default. Labels sit above the field; hints and errors below it. Errors say what is wrong and how to fix it."
          >
            <div className="glass space-y-6 glass-strong p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="sg-pr-number"
                  label="PR Number"
                  hint="As written on the purchase request."
                >
                  <Input
                    id="sg-pr-number"
                    defaultValue="2026091231-A"
                    aria-describedby="sg-pr-number-hint"
                    className="font-mono"
                  />
                </Field>
                <Field id="sg-mode" label="Procurement Mode">
                  <Select id="sg-mode" defaultValue="1">
                    <option value="1">Competitive Bidding</option>
                    <option value="2">Small Value Procurement</option>
                    <option value="3">Negotiated Procurement</option>
                  </Select>
                </Field>
                <Field
                  id="sg-abc"
                  label="ABC"
                  error="Enter an amount greater than zero."
                >
                  <Input
                    id="sg-abc"
                    defaultValue="0.00"
                    aria-invalid
                    aria-describedby="sg-abc-error"
                    className="tabular-nums"
                  />
                </Field>
                <Field id="sg-end-user" label="End-User">
                  <Input
                    id="sg-end-user"
                    defaultValue="Provincial Health Office"
                    disabled
                  />
                </Field>
                <Field
                  id="sg-particulars"
                  label="Particulars"
                  optional
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="sg-particulars"
                    defaultValue="Supply of medicines for the Provincial Hospital"
                  />
                </Field>
              </div>
              <div className="space-y-3 border-t border-foreground/10 pt-6">
                <FormMessage>
                  PR Number 2026091231-A already exists. Open that PR, or use a
                  different number.
                </FormMessage>
                <FormMessage tone="warning">
                  This PR has been at Evaluation for 21 days.
                </FormMessage>
                <FormMessage tone="success">Changes saved.</FormMessage>
              </div>
            </div>
          </Section>

          <Section
            id="badges"
            title="Badges"
            rule="A monochrome pill with a tone dot. It takes its colour from the surrounding text, so it reads on glass, on ink and on paper; the dots flip on ink."
          >
            <div className="glass flex flex-wrap items-center gap-3 p-5 sm:p-6">
              <Badge tone="info">In progress</Badge>
              <Badge tone="success">Completed</Badge>
              <Badge tone="warning">Overdue</Badge>
              <Badge tone="danger">Cancelled</Badge>
              <Badge>Pre-Procurement</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 ink p-5 sm:p-6">
              <span className="text-sm text-on-ink-muted">On ink:</span>
              <Badge tone="info">In progress</Badge>
              <Badge tone="success">Completed</Badge>
              <Badge tone="warning">Overdue</Badge>
              <Badge tone="danger">Cancelled</Badge>
              <Badge>Pre-Procurement</Badge>
            </div>
            <p className="text-sm text-foreground/75">
              For a PR&apos;s status, use <Code>PrStatusBadge</Code>. It derives
              In progress, Completed or Cancelled from the status and stage.
            </p>
          </Section>

          <Section
            id="links"
            title="Links"
            rule="Links are the text colour. Inside running text they always show an underline; in tables, lists and bars the context already says they are links, so the underline appears on hover."
          >
            <div className="glass space-y-5 p-5 sm:p-6">
              <p className="max-w-prose">
                The PR moved to Evaluation on October 14.{" "}
                <a href="#links" className={INLINE_LINK}>
                  View its stage history
                </a>{" "}
                for every move and who made it.{" "}
                <span className="text-sm text-muted-foreground">
                  (<Code>INLINE_LINK</Code>)
                </span>
              </p>
              <p>
                <a href="#links" className={`font-mono ${TEXT_LINK}`}>
                  2026091231-A
                </a>{" "}
                <span className="text-sm text-muted-foreground">
                  (<Code>TEXT_LINK</Code>, as in tables)
                </span>
              </p>
              <BackLink href="/requests">All requests</BackLink>
            </div>
          </Section>

          <Section
            id="tables"
            title="Tables"
            rule="A table sits in its own glass panel with framed={false}, and pagination shares the panel. Below lg, lists switch to stacked entries instead of a wide table."
          >
            <section
              aria-label="Sample table"
              className="glass overflow-hidden"
            >
              <Table framed={false}>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>PR Number</TableHeaderCell>
                    <TableHeaderCell>Particulars</TableHeaderCell>
                    <TableHeaderCell className="text-right">
                      ABC
                    </TableHeaderCell>
                    <TableHeaderCell>Stage</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {SAMPLE_ROWS.map((row) => (
                    <TableRow key={row.prNumber}>
                      <TableCell className="font-mono whitespace-nowrap">
                        {row.prNumber}
                      </TableCell>
                      <TableCell className="min-w-56">
                        {row.particulars}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap tabular-nums">
                        {formatPeso(row.abc)}
                      </TableCell>
                      <TableCell>
                        <Badge>{row.stage}</Badge>
                      </TableCell>
                      <TableCell>
                        <PrStatusBadge
                          status={row.status}
                          stageCode={row.stageCode}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t border-foreground/10 px-4 py-3">
                <Pagination
                  page={1}
                  pageCount={5}
                  total={120}
                  pageSize={25}
                  hrefForPage={(page) => `/styleguide?page=${page}#tables`}
                />
              </div>
            </section>
          </Section>

          <Section
            id="route"
            title="Procurement route"
            rule="The stages drawn as a line. A filled station has requests waiting at it, with the count inside; a hollow one is empty; Completed is the terminal. Used on the public home page."
          >
            <div className="glass max-w-sm p-5 sm:p-6">
              <ProcurementRoute stages={SAMPLE_ROUTE} completed={57} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
