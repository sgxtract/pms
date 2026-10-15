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
import type { BreakdownRow, ReportTotals } from "@/server/queries/reports";

function AmountCells({ totals }: { totals: ReportTotals }) {
  return (
    <>
      <TableCell className="text-right tabular-nums">{totals.count}</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatPeso(totals.inProgressAbc)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatPeso(totals.completedAbc)}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatPeso(totals.activeAbc)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground tabular-nums">
        {formatPeso(totals.cancelledAbc)}
      </TableCell>
    </>
  );
}

export function AbcBreakdownTable({
  title,
  groupLabel,
  rows,
  totals,
}: {
  title: string;
  groupLabel: string;
  rows: BreakdownRow[];
  totals: ReportTotals;
}) {
  const id = `table-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section aria-labelledby={id} className="space-y-3">
      <h3 id={id} className="font-semibold">
        {title}
      </h3>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{groupLabel}</TableHeaderCell>
            <TableHeaderCell className="text-right">PRs</TableHeaderCell>
            <TableHeaderCell className="text-right">
              In progress
            </TableHeaderCell>
            <TableHeaderCell className="text-right">Completed</TableHeaderCell>
            <TableHeaderCell className="text-right">Total ABC</TableHeaderCell>
            <TableHeaderCell className="text-right">Cancelled</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell>{row.name}</TableCell>
              <AmountCells totals={row} />
            </TableRow>
          ))}
        </TableBody>
        <TableFoot>
          <TableRow>
            <TableCell>Total</TableCell>
            <AmountCells totals={totals} />
          </TableRow>
        </TableFoot>
      </Table>
    </section>
  );
}
