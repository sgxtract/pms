import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  StageHistoryEntry,
  StageOption,
} from "@/server/queries/procurement";

const LATE_ENCODING_MS = 60 * 1000;

export function StageTimeline({
  entries,
  stages,
}: {
  entries: StageHistoryEntry[];
  stages: StageOption[];
}) {
  return (
    <ol aria-label="Stage history" className="space-y-6 border-l pl-6">
      {entries.map((entry, index) => {
        const isCurrent = index === 0;
        const from = entry.fromSortOrder;
        const movedBack = from !== null && entry.toSortOrder < from;
        const skipped =
          from !== null && !movedBack
            ? stages
                .filter(
                  (stage) =>
                    stage.sortOrder > from &&
                    stage.sortOrder < entry.toSortOrder,
                )
                .map((stage) => stage.name)
            : [];
        const encodedLater =
          entry.recordedAt.getTime() - entry.effectiveAt.getTime() >
          LATE_ENCODING_MS;

        return (
          <li key={entry.id} className="relative">
            <span
              aria-hidden
              className={cn(
                // -left-6 matches the list's pl-6; the translate centres the dot on the line.
                "absolute top-1.5 -left-6 size-2.5 -translate-x-1/2 rounded-full",
                isCurrent ? "bg-primary" : "bg-border",
              )}
            />
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{entry.toStage}</p>
              {isCurrent && <Badge tone="info">Current</Badge>}
              {movedBack && <Badge tone="warning">Moved back</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              <time dateTime={entry.effectiveAt.toISOString()}>
                {formatDateTime(entry.effectiveAt)}
              </time>
              {entry.fromStage && <>, from {entry.fromStage}</>}
            </p>
            {skipped.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Skipped: {skipped.join(", ")}
              </p>
            )}
            {entry.remarks && (
              <p className="mt-1 max-w-prose text-sm whitespace-pre-line">
                {entry.remarks}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Recorded by {entry.recordedBy}
              {encodedLater && (
                <>, encoded {formatDateTime(entry.recordedAt)}</>
              )}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
