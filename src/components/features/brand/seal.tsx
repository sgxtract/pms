import Image from "next/image";
import seal from "@/assets/seal.png";
import { cn } from "@/lib/utils";

// The provincial seal. Decorative (empty alt) because the LGU's name is
// always written next to it; screen readers would otherwise read it twice.
export function Seal({
  size,
  eager = false,
  className,
}: {
  size: number;
  eager?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={seal}
      alt=""
      width={size}
      height={size}
      loading={eager ? "eager" : "lazy"}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
