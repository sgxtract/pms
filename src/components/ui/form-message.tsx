import { cn } from "@/lib/utils";

export function FormMessage({
  tone = "error",
  children,
}: {
  tone?: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md px-3 py-2 text-sm",
        tone === "error"
          ? "bg-danger-soft text-danger-soft-foreground"
          : "bg-success-soft text-success-soft-foreground",
      )}
    >
      {children}
    </p>
  );
}
