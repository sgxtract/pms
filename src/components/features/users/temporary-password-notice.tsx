"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TemporaryPasswordNotice({
  title,
  fullName,
  employeeId,
  password,
}: {
  title: string;
  fullName: string;
  employeeId: string;
  password: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div role="status" className="rounded-lg border bg-surface p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Give these sign-in details to {fullName} in person. The temporary
        password is shown only once. They&apos;ll choose their own password at
        first sign-in.
      </p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-3 text-sm">
        <dt className="text-muted-foreground">Employee ID</dt>
        <dd className="font-mono">{employeeId}</dd>
        <dt className="text-muted-foreground">Temporary password</dt>
        <dd className="flex flex-wrap items-center gap-3">
          <code className="font-mono text-base">{password}</code>
          <Button size="sm" variant="secondary" onClick={copyPassword}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </dd>
      </dl>
    </div>
  );
}
