// Gives a form control its id, name, and the attributes that connect it
// to its error or hint text for screen readers.
export function fieldAria<Field extends string>(
  errors: Partial<Record<Field, string>>,
  field: Field,
  hasHint = false,
) {
  return {
    id: field,
    name: field,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field]
      ? `${field}-error`
      : hasHint
        ? `${field}-hint`
        : undefined,
  } as const;
}
