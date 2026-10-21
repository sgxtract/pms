import type { ComponentProps } from "react";
import { GLASS_FIELD } from "@/components/ui/glass-field";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(GLASS_FIELD, "min-h-24 px-3 py-2", className)}
      {...props}
    />
  );
}
