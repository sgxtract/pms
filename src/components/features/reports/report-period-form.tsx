import Form from "next/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  REPORT_PERIODS,
  type ReportParams,
  type ReportPeriodKey,
} from "@/lib/report-period";

export function ReportPeriodForm({ params }: { params: ReportParams }) {
  return (
    <Form
      action="/reports"
      aria-label="Report period"
      className="glass grid gap-3 glass-strong p-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="space-y-1">
        <Label htmlFor="period" className="text-xs text-muted-foreground">
          Period
        </Label>
        <Select id="period" name="period" defaultValue={params.period}>
          {(Object.keys(REPORT_PERIODS) as ReportPeriodKey[]).map((key) => (
            <option key={key} value={key}>
              {REPORT_PERIODS[key]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="from" className="text-xs text-muted-foreground">
          From (custom range)
        </Label>
        <Input id="from" name="from" type="date" defaultValue={params.from} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="to" className="text-xs text-muted-foreground">
          To (custom range)
        </Label>
        <Input id="to" name="to" type="date" defaultValue={params.to} />
      </div>

      <Button type="submit" variant="glass">
        Show report
      </Button>
    </Form>
  );
}
