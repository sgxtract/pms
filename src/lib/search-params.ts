import { z } from "zod";
import { isRealDate } from "@/lib/dates";

export type SearchParams = Record<string, string | string[] | undefined>;

// A URL can repeat a parameter (?q=a&q=b); we use the first value.
export const firstValue = (value: unknown) =>
  Array.isArray(value) ? value[0] : value;

export const dateParam = z
  .preprocess(firstValue, z.string().refine(isRealDate).optional())
  .catch(undefined);

export const pageParam = z
  .preprocess(firstValue, z.coerce.number().int().min(1).max(100_000))
  .catch(1);

// Builds "?a=1&b=2", leaving out empty values and page 1.
export function toQueryString(
  values: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === "") continue;
    if (key === "page" && value === 1) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
