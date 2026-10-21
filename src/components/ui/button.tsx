import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Monochrome Frost buttons. Ink is the page's main action (at most two ink
 * elements per page); glass is everything else; ghost is for quiet actions
 * in lists and bars; danger only for destructive actions.
 */
const variants = {
  ghost: "rounded-full text-foreground hover:bg-foreground/5",
  danger: "rounded-full bg-danger text-white hover:bg-danger-hover",
  ink: "rounded-full bg-ink font-semibold text-on-ink shadow-[var(--shadow-float)] transition-transform hover:-translate-y-0.5 active:scale-98 focus-visible:outline-ink",
  glass:
    "rounded-full border border-glass-edge bg-foreground/5 font-medium text-foreground transition-colors hover:bg-foreground/10",
  /** The outline button for use on an ink card. */
  "on-ink":
    "rounded-full border border-on-ink/25 text-on-ink hover:bg-on-ink/10 focus-visible:outline-on-ink",
} as const;

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
  icon: "size-9",
} as const;

type ButtonStyle = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
};

export function buttonClasses({
  variant = "glass",
  size = "md",
  className,
}: ButtonStyle = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & ButtonStyle;

export function Button({
  variant,
  size,
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}
