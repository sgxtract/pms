import type { ComponentProps } from "react";
import { GLASS_FIELD } from "@/components/ui/glass-field";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        GLASS_FIELD,
        // Some browsers paint the open list with the select's background;
        // a translucent one would be hard to read, so options get a solid one.
        "h-9 px-3 [&_option]:bg-glass-solid",
        className,
      )}
      {...props}
    />
  );
}
