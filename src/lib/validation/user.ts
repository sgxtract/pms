import { z } from "zod";
import { ROLES, USER_TYPES } from "@/lib/roles";

export const userDetailsSchema = z
  .object({
    employeeId: z
      .string()
      .trim()
      .min(1, "Enter an Employee ID.")
      .max(50, "Employee ID is too long.")
      .transform((value) => value.toUpperCase()),
    fullName: z
      .string()
      .trim()
      .min(1, "Enter the full name.")
      .max(150, "Full name is too long.")
      .transform((value) => value.replace(/\s+/g, " ")),
    role: z.enum(ROLES),
    userType: z.enum(USER_TYPES).nullable(),
  })
  .refine((data) => data.role !== "user" || data.userType !== null, {
    message: "Choose a user type for regular users.",
    path: ["userType"],
  })
  .transform((data) => ({
    ...data,
    userType: data.role === "user" ? data.userType : null,
  }));

export type UserDetails = z.infer<typeof userDetailsSchema>;
