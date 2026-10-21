/**
 * The look every form control shares, now that every page sits on glass:
 * a 3:1 edge, a faint tint instead of an opaque fill, and autofill paint
 * covered with the glass's solid colour. Input, Select and Textarea apply
 * it themselves, so feature code doesn't need to.
 */
export const GLASS_FIELD = [
  "w-full rounded-xl border border-glass-edge bg-foreground/5 text-sm text-foreground",
  "placeholder:text-muted-foreground",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-danger",
  "autofill:shadow-[inset_0_0_0_100px_var(--glass-solid)] autofill:[-webkit-text-fill-color:var(--foreground)]",
].join(" ");
