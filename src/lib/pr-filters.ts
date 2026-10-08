import { z } from "zod";
import { isRealDate } from "@/lib/dates";

export const PR_PAGE_SIZE = 25;

// A URL can repeat a parameter (?q=a&q=b); we use the first value.
const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const text = (max: number) =>
  z
    .preprocess(first, z.string().trim().max(max).optional())
    .transform((value) => value || undefined)
    .catch(undefined);

const optionId = z
  .preprocess(
    first,
    z
      .string()
      .regex(/^\d{1,5}$/)
      .optional(),
  )
  .catch(undefined);

const date = z
  .preprocess(first, z.string().refine(isRealDate).optional())
  .catch(undefined);

const amount = z
  .preprocess(
    (value) => {
      const raw = first(value);
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
    .preprocess(first, z.enum(["active", "cancelled"]).optional())
    .catch(undefined),
  stage: z
    .preprocess(
      first,
      z
        .string()
        .regex(/^[a-z_]{1,50}$/)
        .optional(),
    )
    .catch(undefined),
  mode: optionId,
  category: optionId,
  type: optionId,
  from: date,
  to: date,
  abcMin: amount,
  abcMax: amount,
  page: z
    .preprocess(first, z.coerce.number().int().min(1).max(100_000))
    .catch(1),
});

export type PrFilters = z.infer<typeof prFiltersSchema>;

export function parsePrFilters(
  searchParams: Record<string, string | string[] | undefined>,
): PrFilters {
  return prFiltersSchema.parse(searchParams);
}

// Builds "?q=...&stage=..." from filters, leaving out empty values.
export function prFiltersToQuery(
  filters: PrFilters,
  overrides: Partial<PrFilters> = {},
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...overrides })) {
    if (value === undefined || value === "") continue;
    if (key === "page" && value === 1) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function hasActiveFilters(filters: PrFilters): boolean {
  return Object.entries(filters).some(
    ([key, value]) => key !== "page" && value !== undefined,
  );
}
