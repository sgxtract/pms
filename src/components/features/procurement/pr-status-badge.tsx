import { Badge } from "@/components/ui/badge";

export function PrStatusBadge({
  status,
  stageCode,
}: {
  status: "active" | "cancelled";
  stageCode: string;
}) {
  if (status === "cancelled") return <Badge tone="danger">Cancelled</Badge>;
  if (stageCode === "completed") return <Badge tone="success">Completed</Badge>;
  return <Badge tone="info">In progress</Badge>;
}
