import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Monochrome pill with a coloured dot. The pill takes its colours from the
 * surrounding text (currentColor), so the same badge reads on glass, on ink
 * and on a plain page. The word carries the meaning; the dot helps scanning.
 */
const tones = {
  neutral: "before:bg-current/40",
  info: "before:bg-tone-info",
  success: "before:bg-tone-success",
  warning: "before:bg-tone-warning",
  danger: "before:bg-tone-danger",
} as const;

type BadgeProps = ComponentProps<"span"> & {
  tone?: keyof typeof tones;
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-current/8 px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-current/15 ring-inset",
        "before:size-1.5 before:shrink-0 before:rounded-full before:content-['']",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
