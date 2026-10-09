import Form from "next/form";
import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { hasActiveAuditFilters, type AuditFilters } from "@/lib/audit-filters";
import { AUDIT_AREAS, type AuditArea } from "@/lib/audit-labels";
import { ROLE_LABELS, type Role } from "@/lib/roles";

export function AuditFilterBar({
  filters,
  actors,
  showActorFilter,
}: {
  filters: AuditFilters;
  actors: { id: string; fullName: string; role: Role }[];
  showActorFilter: boolean;
}) {
  return (
    <Form
      action="/audit-log"
      role="search"
      aria-label="Filter audit log"
      className="grid gap-3 rounded-lg border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.5fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="space-y-1">
        <Label htmlFor="area" className="text-xs text-muted-foreground">
          Area
        </Label>
        <Select id="area" name="area" defaultValue={filters.area ?? ""}>
          <option value="">All areas</option>
          {(Object.keys(AUDIT_AREAS) as AuditArea[]).map((area) => (
            <option key={area} value={area}>
              {AUDIT_AREAS[area]}
            </option>
          ))}
        </Select>
      </div>

      {showActorFilter ? (
        <div className="space-y-1">
          <Label htmlFor="actor" className="text-xs text-muted-foreground">
            Done by
          </Label>
          <Select id="actor" name="actor" defaultValue={filters.actor ?? ""}>
            <option value="">Anyone</option>
            {actors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.fullName} ({ROLE_LABELS[actor.role]})
              </option>
            ))}
          </Select>
        </div>
      ) : (
        <div className="hidden lg:block" />
      )}

      <div className="space-y-1">
        <Label htmlFor="from" className="text-xs text-muted-foreground">
          From
        </Label>
        <Input id="from" name="from" type="date" defaultValue={filters.from} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="to" className="text-xs text-muted-foreground">
          To
        </Label>
        <Input id="to" name="to" type="date" defaultValue={filters.to} />
      </div>

      <div className="flex gap-2">
        <Button type="submit">Apply</Button>
        {hasActiveAuditFilters(filters) && (
          <Link
            href="/audit-log"
            className={buttonClasses({ variant: "secondary" })}
          >
            Clear
          </Link>
        )}
      </div>
    </Form>
  );
}
