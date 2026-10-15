import { z } from "zod";

const line = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(z.string().max(100, "Keep this under 100 characters."));

// The form's fields. Blank is allowed: the line is left for handwriting.
export const signatoriesFormSchema = z.object({
  preparedByName: line,
  preparedByPosition: line,
  notedByName: line,
  notedByPosition: line,
});

export type SignatoriesForm = z.infer<typeof signatoriesFormSchema>;
export const SIGNATORY_FIELDS = Object.keys(
  signatoriesFormSchema.shape,
) as (keyof SignatoriesForm)[];

const signatory = z.object({ name: z.string(), position: z.string() });

// The shape stored in system_settings.
export const storedSignatoriesSchema = z.object({
  preparedBy: signatory,
  notedBy: signatory,
});

export type ReportSignatories = z.infer<typeof storedSignatoriesSchema>;

export const EMPTY_SIGNATORIES: ReportSignatories = {
  preparedBy: { name: "", position: "" },
  notedBy: { name: "", position: "" },
};

export function toStoredSignatories(form: SignatoriesForm): ReportSignatories {
  return {
    preparedBy: {
      name: form.preparedByName,
      position: form.preparedByPosition,
    },
    notedBy: { name: form.notedByName, position: form.notedByPosition },
  };
}

export function toSignatoriesForm(stored: ReportSignatories): SignatoriesForm {
  return {
    preparedByName: stored.preparedBy.name,
    preparedByPosition: stored.preparedBy.position,
    notedByName: stored.notedBy.name,
    notedByPosition: stored.notedBy.position,
  };
}
