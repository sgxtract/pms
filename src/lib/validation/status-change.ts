import { z } from "zod";

export const statusChangeSchema = z.object({
  prId: z.string().regex(/^\d+$/, "This PR could not be found."),
  intent: z.enum(["cancel", "restore"]),
  remarks: z
    .string()
    .trim()
    .min(1, "Explain the reason.")
    .max(1000, "Remarks are too long."),
});
