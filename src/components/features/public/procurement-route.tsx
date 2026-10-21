import Link from "next/link";
import { cn } from "@/lib/utils";

export type RouteStage = { code: string; name: string; count: number };

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Smaller figures once the count needs three digits, so it stays inside the dot. */
function countSize(count: number) {
  return count >= 100 ? "text-[0.625rem]" : "text-xs";
}

function requestsLabel(count: number) {
  if (count === 0) return "no requests";
  return `${count} ${count === 1 ? "request" : "requests"}`;
}

/**
 * The procurement process drawn as a line with stations. A filled station has
 * requests waiting at it, with the count inside the dot; a hollow one is
 * empty. Completed is the terminal. The line draws itself once on load.
 */
export function ProcurementRoute({
  stages,
  completed,
  hrefForStage = (code) => `/procurements?status=in_progress&stage=${code}`,
  completedHref = "/procurements?status=completed",
}: {
  stages: RouteStage[];
  completed: number;
  hrefForStage?: (code: string) => string;
  completedHref?: string;
}) {
  const stations = [
    ...stages.map((stage) => ({
      ...stage,
      href: hrefForStage(stage.code),
      isTerminal: false,
    })),
    {
      code: "completed",
      name: "Completed",
      count: completed,
      href: completedHref,
      isTerminal: true,
    },
  ];

  return (
    <ol>
      {stations.map((station, index) => {
        const isOccupied = station.count > 0;
        const delay = { animationDelay: `${index * 45}ms` };

        return (
          <li key={station.code} className="relative">
            {/* The line from this station down to the next one. */}
            {!station.isTerminal && (
              <span
                aria-hidden
                style={delay}
                className="absolute top-1/2 left-5.5 h-full w-0.5 origin-top -translate-x-1/2 bg-foreground/30 motion-safe:animate-[route-line_500ms_var(--ease-glass)_both]"
              />
            )}
            <Link
              href={station.href}
              className={cn(
                "grid grid-cols-[2.75rem_1fr] items-center rounded-2xl py-1.5 pr-3 transition-colors duration-200 ease-glass hover:bg-foreground/5",
                FOCUS,
              )}
            >
              <span
                aria-hidden
                style={delay}
                className="relative grid place-items-center motion-safe:animate-[route-station_400ms_var(--ease-glass)_both]"
              >
                {station.isTerminal ? (
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-full border-2 border-foreground bg-glass-solid font-semibold tabular-nums",
                      countSize(station.count),
                    )}
                  >
                    {station.count}
                  </span>
                ) : isOccupied ? (
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-full bg-ink font-semibold text-on-ink tabular-nums",
                      countSize(station.count),
                    )}
                  >
                    {station.count}
                  </span>
                ) : (
                  <span className="size-3 rounded-full border-2 border-foreground/30 bg-glass-solid" />
                )}
              </span>
              <span
                className={cn(
                  "py-1 text-sm",
                  station.isTerminal && "font-semibold",
                  !station.isTerminal && isOccupied && "font-medium",
                  !station.isTerminal && !isOccupied && "text-muted-foreground",
                )}
              >
                {station.name}
                <span className="sr-only">
                  , {requestsLabel(station.count)}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
