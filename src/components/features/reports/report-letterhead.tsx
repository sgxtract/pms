import Image from "next/image";
import { SITE } from "@/lib/site-config";

// Shown only when printing.
export function ReportLetterhead() {
  return (
    <header className="mb-6 hidden border-b-2 border-foreground pb-3 text-center print:block">
      {SITE.letterhead.sealSrc && (
        <Image
          src={SITE.letterhead.sealSrc}
          alt=""
          width={64}
          height={64}
          loading="eager"
          className="mx-auto mb-2"
        />
      )}
      {SITE.letterhead.lines.map((line) => (
        <p key={line} className="text-sm">
          {line}
        </p>
      ))}
      <p className="font-heading text-lg font-semibold">{SITE.lguName}</p>
      <p className="text-sm">
        {SITE.officeName} ({SITE.officeShortName})
      </p>
    </header>
  );
}
