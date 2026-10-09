import { z } from "zod";
import { AUDIT_AREAS, type AuditArea } from "@/lib/audit-labels";
import {
  dateParam,
  firstValue,
  pageParam,
  toQueryString,
  type SearchParams,
} from "@/lib/search-params";

export const AUDIT_PAGE_SIZE = 50;

const areas = Object.keys(AUDIT_AREAS) as [AuditArea, ...AuditArea[]];

export const auditFiltersSchema = z.object({
  area: z.preprocess(firstValue, z.enum(areas).optional()).catch(undefined),
  actor: z
    .preprocess(
      firstValue,
      z
        .string()
        .regex(/^\d{1,18}$/)
        .optional(),
    )
    .catch(undefined),
  from: dateParam,
  to: dateParam,
  page: pageParam,
});

export type AuditFilters = z.infer<typeof auditFiltersSchema>;

export function parseAuditFilters(searchParams: SearchParams): AuditFilters {
  return auditFiltersSchema.parse(searchParams);
}

export function auditFiltersToQuery(
  filters: AuditFilters,
  overrides: Partial<AuditFilters> = {},
): string {
  return toQueryString({ ...filters, ...overrides });
}

export function hasActiveAuditFilters(filters: AuditFilters): boolean {
  return Object.entries(filters).some(
    ([key, value]) => key !== "page" && value !== undefined,
  );
}
