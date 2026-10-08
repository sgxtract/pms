import { z } from "zod";
import { isRealDate, todayInManila } from "@/lib/dates";
import { pastManilaDateTime } from "./common";

// Single-line text: trimmed, with repeated spaces collapsed.
const singleLine = (requiredMessage: string, max: number) =>
  z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, " "))
    .pipe(
      z.string().min(1, requiredMessage).max(max, "This entry is too long."),
    );

// An optional dropdown: "" means "not specified".
const optionalOptionId = z
  .string()
  .regex(/^\d*$/, "Choose a valid option.")
  .transform((value) => (value === "" ? null : value));

export const prFormSchema = z.object({
  prNumber: z
    .string()
    .trim()
    .min(1, "Enter the PR Number.")
    .max(50, "PR Number is too long.")
    .transform((value) => value.toUpperCase()),
  prDate: z
    .string()
    .refine(isRealDate, "Enter a valid PR date.")
    .refine(
      (value) => value <= todayInManila(),
      "PR date can't be in the future.",
    ),
  referenceCode: z
    .string()
    .trim()
    .max(50, "Reference ID is too long.")
    .transform((value) => (value === "" ? null : value.toUpperCase())),
  prTypeId: optionalOptionId,
  prCategoryId: z.string().regex(/^\d+$/, "Choose a category."),
  endUser: singleLine("Enter the End-User.", 200),
  particulars: z
    .string()
    .trim()
    .min(1, "Enter the Particulars.")
    .max(2000, "Particulars is too long."),
  abc: z
    .string()
    .transform((value) => value.replace(/[\s,₱]/g, ""))
    .pipe(
      z
        .string()
        .regex(
          /^\d{1,13}(\.\d{1,2})?$/,
          "Enter the ABC as an amount, such as 1,250,000.00.",
        )
        .refine((value) => Number(value) > 0, "ABC must be greater than zero."),
    ),
  sourceOfFunds: singleLine("Enter the Source of Funds.", 200),
  procurementModeId: optionalOptionId,
  calendarDays: z
    .string()
    .trim()
    .regex(/^\d*$/, "Calendar Days must be a whole number.")
    .transform((value) => (value === "" ? null : Number(value)))
    .refine(
      (value) => value === null || (value >= 1 && value <= 3650),
      "Calendar Days must be between 1 and 3,650.",
    ),
  accountCode: singleLine("Enter the Account Code.", 100),
  receivedAt: pastManilaDateTime("Enter when the PR was received."),
  remarks: z
    .string()
    .trim()
    .max(1000, "Remarks are too long.")
    .transform((value) => (value === "" ? null : value)),
});

export type PrFormField = keyof z.input<typeof prFormSchema>;
export const PR_FORM_FIELDS = Object.keys(prFormSchema.shape) as PrFormField[];
