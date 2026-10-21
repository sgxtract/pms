import Form from "next/form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TEXT_LINK } from "@/components/ui/link-styles";
import { Select } from "@/components/ui/select";
import {
  hasActivePublicFilters,
  type PublicPrFilters,
} from "@/lib/public-pr-filters";
import type { Option } from "@/server/queries/procurement";

export function PublicFilterBar({
  filters,
  options,
}: {
  filters: PublicPrFilters;
  options: { stages: { code: string; name: string }[]; modes: Option[] };
}) {
  return (
    <Form
      action="/procurements"
      role="search"
      aria-label="Search procurement"
      className="glass grid gap-3 glass-strong p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="space-y-1">
        <Label htmlFor="q" className="text-xs text-muted-foreground">
          Search
        </Label>
        <Input
          id="q"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="PR Number, Particulars, or End-User"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="status" className="text-xs text-muted-foreground">
          Status
        </Label>
        <Select id="status" name="status" defaultValue={filters.status ?? ""}>
          <option value="">All</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="stage" className="text-xs text-muted-foreground">
          Stage
        </Label>
        <Select id="stage" name="stage" defaultValue={filters.stage ?? ""}>
          <option value="">All stages</option>
          {options.stages.map((stage) => (
            <option key={stage.code} value={stage.code}>
              {stage.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="mode" className="text-xs text-muted-foreground">
          Procurement Mode
        </Label>
        <Select id="mode" name="mode" defaultValue={filters.mode ?? ""}>
          <option value="">All modes</option>
          {options.modes.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="glass">
          Search
        </Button>
        {hasActivePublicFilters(filters) && (
          <Link href="/procurements" className={`text-sm ${TEXT_LINK}`}>
            Clear
          </Link>
        )}
      </div>
    </Form>
  );
}
