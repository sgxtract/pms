import { z } from "zod";
import { pastManilaDateTime } from "@/lib/validation/common";

export const moveStageSchema = z.object({
  prId: z.string().regex(/^\d+$/, "This PR could not be found."),
  toStageId: z.string().regex(/^\d{1,5}$/, "Choose the stage to move to."),
  effectiveAt: pastManilaDateTime("Enter when the PR moved."),
  remarks: z
    .string()
    .trim()
    .max(1000, "Remarks are too long.")
    .transform((value) => (value === "" ? null : value)),
});

export type MoveStageField = keyof z.input<typeof moveStageSchema>;
export const MOVE_STAGE_FIELDS = Object.keys(
  moveStageSchema.shape,
) as MoveStageField[];
