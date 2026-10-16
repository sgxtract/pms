import { SITE } from "@/lib/site-config";
import { Seal } from "../brand/seal";

// Shown only when printing.
export function ReportLetterhead() {
  return (
    <header className="mb-6 hidden border-b-2 border-foreground pb-3 text-center print:block">
      <Seal size={64} eager className="mx-auto mb-2" />
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
