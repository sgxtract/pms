import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Table({
  className,
  framed = true,
  ...props
}: ComponentProps<"table"> & { framed?: boolean }) {
  return (
    <div
      className={cn(
        "overflow-x-auto",
        framed && "rounded-lg border bg-surface",
      )}
    >
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}

export function TableHead({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      className={cn("border-b border-foreground/10 bg-foreground/3", className)}
      {...props}
    />
  );
}

export function TableBody(props: ComponentProps<"tbody">) {
  return <tbody {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-foreground/10 transition-colors last:border-0 hover:bg-foreground/5",
        className,
      )}
      {...props}
    />
  );
}

export function TableHeaderCell({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2.5 text-left font-medium whitespace-nowrap text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}

export function TableFoot({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      className={cn(
        "border-t-2 border-foreground/10 bg-foreground/3 font-medium",
        className,
      )}
      {...props}
    />
  );
}
