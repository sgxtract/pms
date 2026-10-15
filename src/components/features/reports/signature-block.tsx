import type { ReportSignatories } from "@/lib/validation/settings";

// Shown only when printing.
export function SignatureBlock({
  signatories,
}: {
  signatories: ReportSignatories;
}) {
  const signers = [
    { label: "Prepared by:", ...signatories.preparedBy },
    { label: "Noted by:", ...signatories.notedBy },
  ];

  return (
    <div className="mt-14 hidden grid-cols-2 gap-16 print:grid print:break-inside-avoid">
      {signers.map((signer) => (
        <div key={signer.label}>
          <p className="text-sm">{signer.label}</p>
          <div className="mt-12 border-b border-foreground" />
          <p className="mt-1 font-semibold uppercase">
            {signer.name || "\u00A0"}
          </p>
          <p className="text-sm">{signer.position || "\u00A0"}</p>
        </div>
      ))}
    </div>
  );
}
