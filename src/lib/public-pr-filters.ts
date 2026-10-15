import { z } from "zod";
import {
  firstValue,
  pageParam,
  toQueryString,
  type SearchParams,
} from "@/lib/search-params";

export const PUBLIC_PAGE_SIZE = 25;

export const publicPrFiltersSchema = z.object({
  q: z
    .preprocess(firstValue, z.string().trim().max(100).optional())
    .transform((value) => value || undefined)
    .catch(undefined),
  status: z
    .preprocess(
      firstValue,
      z.enum(["in_progress", "completed", "cancelled"]).optional(),
    )
    .catch(undefined),
  stage: z
    .preprocess(
      firstValue,
      z
        .string()
        .regex(/^[a-z_]{1,50}$/)
        .optional(),
    )
    .catch(undefined),
  mode: z
    .preprocess(
      firstValue,
      z
        .string()
        .regex(/^\d{1,5}$/)
        .optional(),
    )
    .catch(undefined),
  page: pageParam,
});

export type PublicPrFilters = z.infer<typeof publicPrFiltersSchema>;

export function parsePublicPrFilters(
  searchParams: SearchParams,
): PublicPrFilters {
  return publicPrFiltersSchema.parse(searchParams);
}

export function publicPrFiltersToQuery(
  filters: PublicPrFilters,
  overrides: Partial<PublicPrFilters> = {},
): string {
  return toQueryString({ ...filters, ...overrides });
}

export function hasActivePublicFilters(filters: PublicPrFilters): boolean {
  return Object.entries(filters).some(
    ([key, value]) => key !== "page" && value !== undefined,
  );
}
