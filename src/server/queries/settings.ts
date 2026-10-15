import "server-only";
import {
  EMPTY_SIGNATORIES,
  storedSignatoriesSchema,
  type ReportSignatories,
} from "@/lib/validation/settings";
import { sql } from "@/server/db";

export async function getReportSignatories(): Promise<ReportSignatories> {
  const [row] = await sql<{ value: unknown }[]>`
    SELECT value FROM system_settings WHERE key = 'report_signatories'
  `;
  const parsed = storedSignatoriesSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : EMPTY_SIGNATORIES;
}
