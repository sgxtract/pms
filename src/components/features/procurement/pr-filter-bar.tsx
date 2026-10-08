import Form from "next/form";
import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { hasActiveFilters, type PrFilters } from "@/lib/pr-filters";
import type { Option } from "@/server/queries/procurement";

type FilterOptions = {
  stages: { code: string; name: string }[];
  modes: Option[];
  categories: Option[];
  types: Option[];
};

function FilterField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function OptionList({ options }: { options: Option[] }) {
  return options.map((option) => (
    <option key={option.id} value={option.id}>
      {option.name}
    </option>
  ));
}

export function PrFilterBar({
  filters,
  options,
}: {
  filters: PrFilters;
  options: FilterOptions;
}) {
  const moreCount = [
    filters.category,
    filters.type,
    filters.from,
    filters.to,
    filters.abcMin,
    filters.abcMax,
  ].filter(Boolean).length;

  return (
    <Form
      action="/requests"
      role="search"
      aria-label="Filter PRs"
      className="space-y-3 rounded-lg border bg-surface p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
        <FilterField id="q" label="Search">
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="PR Number, Reference ID, Particulars, or End-User"
          />
        </FilterField>

        <FilterField id="status" label="Status">
          <Select id="status" name="status" defaultValue={filters.status ?? ""}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </FilterField>

        <FilterField id="stage" label="Stage">
          <Select id="stage" name="stage" defaultValue={filters.stage ?? ""}>
            <option value="">All stages</option>
            {options.stages.map((stage) => (
              <option key={stage.code} value={stage.code}>
                {stage.name}
              </option>
            ))}
          </Select>
        </FilterField>

        <FilterField id="mode" label="Procurement Mode">
          <Select id="mode" name="mode" defaultValue={filters.mode ?? ""}>
            <option value="">All modes</option>
            <OptionList options={options.modes} />
          </Select>
        </FilterField>

        <div className="flex gap-2">
          <Button type="submit">Apply</Button>
          {hasActiveFilters(filters) && (
            <Link
              href="/requests"
              className={buttonClasses({ variant: "secondary" })}
            >
              Clear
            </Link>
          )}
        </div>
      </div>

      <details open={moreCount > 0}>
        <summary className="cursor-pointer text-sm font-medium text-link">
          More filters{moreCount > 0 && ` (${moreCount} in use)`}
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterField id="category" label="Category">
            <Select
              id="category"
              name="category"
              defaultValue={filters.category ?? ""}
            >
              <option value="">All categories</option>
              <OptionList options={options.categories} />
            </Select>
          </FilterField>

          <FilterField id="type" label="Type of PR">
            <Select id="type" name="type" defaultValue={filters.type ?? ""}>
              <option value="">All types</option>
              <OptionList options={options.types} />
            </Select>
          </FilterField>

          <div className="grid grid-cols-2 gap-2">
            <FilterField id="from" label="PR date from">
              <Input
                id="from"
                name="from"
                type="date"
                defaultValue={filters.from}
              />
            </FilterField>
            <FilterField id="to" label="PR date to">
              <Input id="to" name="to" type="date" defaultValue={filters.to} />
            </FilterField>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FilterField id="abcMin" label="ABC from">
              <Input
                id="abcMin"
                name="abcMin"
                inputMode="decimal"
                defaultValue={filters.abcMin}
                className="tabular-nums"
              />
            </FilterField>
            <FilterField id="abcMax" label="ABC to">
              <Input
                id="abcMax"
                name="abcMax"
                inputMode="decimal"
                defaultValue={filters.abcMax}
                className="tabular-nums"
              />
            </FilterField>
          </div>
        </div>
      </details>
    </Form>
  );
}
