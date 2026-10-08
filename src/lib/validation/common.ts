import { z } from "zod";
import { isRealDate, manilaInputToDate } from "@/lib/dates";

// A datetime-local value in Manila time that isn't in the future.
export const pastManilaDateTime = (requiredMessage: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, requiredMessage)
    .refine((value) => isRealDate(value.slice(0, 10)), "Enter a valid date.")
    .refine(
      (value) => manilaInputToDate(value) <= new Date(),
      "This time can't be in the future.",
    );
