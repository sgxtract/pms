import { cn } from "@/lib/utils";

const TONES = {
  error: "bg-danger-soft text-danger-soft-foreground",
  success: "bg-success-soft text-success-soft-foreground",
  warning: "bg-warning-soft text-warning-soft-foreground",
} as const;

export function FormMessage({
  tone = "error",
  children,
}: {
  tone?: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-md px-3 py-2 text-sm", TONES[tone])}
    >
      {children}
    </div>
  );
}