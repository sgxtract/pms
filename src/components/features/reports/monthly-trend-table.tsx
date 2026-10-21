import {
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { formatPeso } from "@/lib/format";
import type { MonthlyRow, ReportTotals } from "@/server/queries/reports";

const MONTH = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function monthLabel(month: string) {
  const [year, m] = month.split("-").map(Number);
  return MONTH.format(new Date(Date.UTC(year, m - 1, 1)));
}

export function MonthlyTrendTable({
  rows,
  totals,
}: {
  rows: MonthlyRow[];
  totals: ReportTotals;
}) {
  const max = Math.max(0, ...rows.map((row) => Number(row.activeAbc)));

  return (
    <section
      aria-labelledby="monthly-heading"
      className="glass overflow-hidden print:break-inside-avoid"
    >
      <div className="px-5 pt-5 pb-3">
        <h3 id="monthly-heading" className="font-semibold">
          Month by month
        </h3>
        <p className="mt-1 text-sm text-foreground/75">
          By PR date. PRs and Total ABC exclude cancelled PRs.
        </p>
      </div>
      <Table framed={false}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Month</TableHeaderCell>
            <TableHeaderCell className="text-right">PRs</TableHeaderCell>
            <TableHeaderCell className="text-right">Total ABC</TableHeaderCell>
            <TableHeaderCell className="w-1/3">
              <span className="sr-only">Compared with the busiest month</span>
            </TableHeaderCell>
            <TableHeaderCell className="text-right">Cancelled</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const width = max > 0 ? (Number(row.activeAbc) / max) * 100 : 0;
            return (
              <TableRow key={row.month}>
                <TableCell>{monthLabel(row.month)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.inProgressCount + row.completedCount}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPeso(row.activeAbc)}
                </TableCell>
                <TableCell>
                  <div
                    aria-hidden
                    className="h-2 rounded-full bg-foreground/10 [print-color-adjust:exact]"
                  >
                    <div
                      className="h-2 rounded-full bg-foreground/70"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {row.cancelledCount}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFoot>
          <TableRow className="font-semibold">
            <TableCell>Total</TableCell>
            <TableCell className="text-right tabular-nums">
              {totals.inProgressCount + totals.completedCount}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPeso(totals.activeAbc)}
            </TableCell>
            <TableCell />
            <TableCell className="text-right text-muted-foreground tabular-nums">
              {totals.cancelledCount}
            </TableCell>
          </TableRow>
        </TableFoot>
      </Table>
    </section>
  );
}
