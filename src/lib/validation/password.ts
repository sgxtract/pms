import { z } from "zod";

export const PASSWORD_RULES = [
  {
    label: "At least 8 characters",
    message: "Use at least 8 characters.",
    test: (value: string) => value.length >= 8,
  },
  {
    label: "An uppercase letter (A–Z)",
    message: "Include an uppercase letter.",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: "A lowercase letter (a–z)",
    message: "Include a lowercase letter.",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    label: "A number (0–9)",
    message: "Include a number.",
    test: (value: string) => /[0-9]/.test(value),
  },
  {
    label: "A special character, such as ! @ # $",
    message: "Include a special character.",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
];

export const passwordSchema = z
  .string()
  .max(128, "Use at most 128 characters.")
  .superRefine((value, context) => {
    for (const rule of PASSWORD_RULES) {
      if (!rule.test(value)) {
        context.addIssue({ code: "custom", message: rule.message });
      }
    }
  });
