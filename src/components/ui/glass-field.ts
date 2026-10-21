/**
 * Form controls on glass: a 3:1 edge, a faint tint instead of an opaque
 * fill, and autofill paint covered with the glass's solid colour.
 */
export const GLASS_FIELD =
  "rounded-xl border border-glass-edge bg-foreground/5 autofill:shadow-[inset_0_0_0_100px_var(--glass-solid)] autofill:[-webkit-text-fill-color:var(--foreground)] [&_option]:bg-[var(--glass-solid)]";
