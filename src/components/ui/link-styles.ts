/** Shared link looks. Links are ink-coloured; blue is kept for focus rings. */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Where the context already says "this is a link": tables, lists, nav-like spots. */
export const TEXT_LINK = `rounded-sm font-medium underline-offset-4 hover:underline ${FOCUS}`;

/** Inside running text, where a link needs a visible underline to be found. */
export const INLINE_LINK = `rounded-sm underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground ${FOCUS}`;
