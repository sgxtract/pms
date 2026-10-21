import {
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { ProcessingRow } from "@/server/queries/reports";

function days(value: number | null) {
  return value === null ? "—" : `${value} ${value === 1 ? "day" : "days"}`;
}

function Cells({ row }: { row: ProcessingRow }) {
  return (
    <>
      <TableCell>{row.name}</TableCell>
      <TableCell className="text-right tabular-nums">
        {row.completedCount}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {days(row.medianDays)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {days(row.avgDays)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {days(row.longestDays)}
      </TableCell>
    </>
  );
}

export function ProcessingTimeTable({ rows }: { rows: ProcessingRow[] }) {
  const total = rows.find((row) => row.isTotal);
  const modes = rows.filter((row) => !row.isTotal);

  return (
    <section
      aria-labelledby="processing-heading"
      className="glass overflow-hidden print:break-inside-avoid"
    >
      <div className="px-5 pt-5 pb-3">
        <h3 id="processing-heading" className="font-semibold">
          Processing time by Procurement Mode
        </h3>
        <p className="mt-1 text-sm text-foreground/75">
          Completed PRs only: days from the PR date to the day the PR reached
          Completed.
        </p>
      </div>
      {!total || total.completedCount === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted-foreground">
          None of this period&apos;s PRs have been completed yet.
        </p>
      ) : (
        <Table framed={false}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Procurement Mode</TableHeaderCell>
              <TableHeaderCell className="text-right">
                Completed
              </TableHeaderCell>
              <TableHeaderCell className="text-right">Median</TableHeaderCell>
              <TableHeaderCell className="text-right">Average</TableHeaderCell>
              <TableHeaderCell className="text-right">Longest</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modes.map((row) => (
              <TableRow key={row.key}>
                <Cells row={row} />
              </TableRow>
            ))}
          </TableBody>
          <TableFoot>
            <TableRow className="font-semibold">
              <Cells row={total} />
            </TableRow>
          </TableFoot>
        </Table>
      )}
    </section>
  );
}
