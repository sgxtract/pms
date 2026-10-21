import type { ComponentProps } from "react";
import { GLASS_FIELD } from "@/components/ui/glass-field";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input className={cn(GLASS_FIELD, "h-9 px-3", className)} {...props} />
  );
}
