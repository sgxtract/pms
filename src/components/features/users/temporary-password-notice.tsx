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
    <div role="status" className="ink p-6">
      <h2 className="text-sm font-medium text-on-ink-muted">{title}</h2>
      <p className="mt-2 font-heading text-xl leading-tight font-semibold">
        {fullName}
      </p>

      <dl className="mt-5 space-y-4">
        <div>
          <dt className="text-sm text-on-ink-muted">Employee ID</dt>
          <dd className="mt-0.5 font-mono">{employeeId}</dd>
        </div>
        <div>
          <dt className="text-sm text-on-ink-muted">Temporary password</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-3">
            <code className="font-mono text-2xl tracking-wide break-all select-all">
              {password}
            </code>
            <Button size="sm" variant="on-ink" onClick={copyPassword}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </dd>
        </div>
      </dl>

      <p className="mt-5 border-t border-on-ink/15 pt-4 text-sm text-on-ink-muted">
        Give these sign-in details to {fullName} in person. The temporary
        password is shown only once. They&apos;ll choose their own password at
        first sign-in.
      </p>
    </div>
  );
}
