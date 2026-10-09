import { z } from "zod";
import {
  dateParam,
  firstValue,
  pageParam,
  toQueryString,
  type SearchParams,
} from "@/lib/search-params";

export const PR_PAGE_SIZE = 25;

const text = (max: number) =>
  z
    .preprocess(firstValue, z.string().trim().max(max).optional())
    .transform((value) => value || undefined)
    .catch(undefined);

const optionId = z
  .preprocess(
    firstValue,
    z
      .string()
      .regex(/^\d{1,5}$/)
      .optional(),
  )
  .catch(undefined);

const amount = z
  .preprocess(
    (value) => {
      const raw = firstValue(value);
      return typeof raw === "string" ? raw.replace(/[\s,₱]/g, "") : raw;
    },
    z
      .string()
      .regex(/^\d{1,13}(\.\d{1,2})?$/)
      .optional(),
  )
  .catch(undefined);

export const prFiltersSchema = z.object({
  q: text(100),
  status: z
    .preprocess(firstValue, z.enum(["active", "cancelled"]).optional())
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
  mode: optionId,
  category: optionId,
  type: optionId,
  from: dateParam,
  to: dateParam,
  abcMin: amount,
  abcMax: amount,
  page: pageParam,
});

export type PrFilters = z.infer<typeof prFiltersSchema>;

export function parsePrFilters(searchParams: SearchParams): PrFilters {
  return prFiltersSchema.parse(searchParams);
}

export function prFiltersToQuery(
  filters: PrFilters,
  overrides: Partial<PrFilters> = {},
): string {
  return toQueryString({ ...filters, ...overrides });
}

export function hasActiveFilters(filters: PrFilters): boolean {
  return Object.entries(filters).some(
    ([key, value]) => key !== "page" && value !== undefined,
  );
}
