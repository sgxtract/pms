import { AUDIT_FIELD_LABELS } from "@/lib/audit-labels";
import { formatDate, formatDateTime, formatPeso } from "@/lib/format";
import { ROLE_LABELS, USER_TYPE_LABELS } from "@/lib/roles";

type Change = { from: unknown; to: unknown };

function isChange(value: unknown): value is Change {
  return (
    typeof value === "object" &&
    value !== null &&
    "from" in value &&
    "to" in value
  );
}

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    if (field === "abc") return formatPeso(value);
    if (field === "prDate") return formatDate(value);
    if (field.endsWith("At")) return formatDateTime(value);
    if (field === "role" && value in ROLE_LABELS) {
      return ROLE_LABELS[value as keyof typeof ROLE_LABELS];
    }
    if (field === "userType" && value in USER_TYPE_LABELS) {
      return USER_TYPE_LABELS[value as keyof typeof USER_TYPE_LABELS];
    }
    return value;
  }
  if (typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function ChangeList({ entries }: { entries: [string, unknown][] }) {
  return (
    <dl className="space-y-1">
      {entries.map(([field, value]) => (
        <div key={field}>
          <dt className="inline text-muted-foreground">
            {AUDIT_FIELD_LABELS[field] ?? field}:{" "}
          </dt>
          <dd className="inline">
            {isChange(value) ? (
              <>
                {formatValue(field, value.from)}
                <span aria-hidden> → </span>
                <span className="sr-only"> changed to </span>
                {formatValue(field, value.to)}
              </>
            ) : (
              formatValue(field, value)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const COLLAPSE_AFTER = 3;

export function AuditChanges({
  changes,
}: {
  changes: Record<string, unknown> | null;
}) {
  const entries = Object.entries(changes ?? {});
  if (entries.length === 0) {
    return <span className="text-muted-foreground">No details</span>;
  }
  if (entries.length <= COLLAPSE_AFTER) {
    return <ChangeList entries={entries} />;
  }
  return (
    <details>
      <summary className="cursor-pointer text-link">
        {entries.length} details
      </summary>
      <div className="mt-2">
        <ChangeList entries={entries} />
      </div>
    </details>
  );
}
