"use client";

import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import type { SignatoriesForm as SignatoriesValues } from "@/lib/validation/settings";
import {
  updateReportSignatories,
  type SettingsState,
} from "@/server/actions/settings";

const GROUPS = [
  {
    legend: "Prepared by",
    name: "preparedByName",
    position: "preparedByPosition",
  },
  { legend: "Noted by", name: "notedByName", position: "notedByPosition" },
] as const;

export function SignatoriesForm({ defaults }: { defaults: SignatoriesValues }) {
  const [state, formAction, isPending] = useActionState<
    SettingsState,
    FormData
  >(updateReportSignatories, undefined);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="space-y-6"
    >
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-foreground/10">
        {GROUPS.map((group) => (
          <fieldset
            key={group.legend}
            className="min-w-0 space-y-4 sm:pr-6 sm:last:pr-0 sm:last:pl-6"
          >
            <legend className="mb-3 font-semibold">{group.legend}</legend>
            <Field id={group.name} label="Name" optional>
              <Input
                id={group.name}
                name={group.name}
                defaultValue={defaults[group.name]}
                autoComplete="off"
              />
            </Field>
            <Field id={group.position} label="Position" optional>
              <Input
                id={group.position}
                name={group.position}
                defaultValue={defaults[group.position]}
                autoComplete="off"
              />
            </Field>
          </fieldset>
        ))}
      </div>

      {state?.status === "error" && <FormMessage>{state.message}</FormMessage>}
      {state?.status === "saved" && (
        <FormMessage tone="success">Signatories saved.</FormMessage>
      )}

      <Button type="submit" variant="ink" disabled={isPending}>
        {isPending ? "Saving…" : "Save signatories"}
      </Button>
    </form>
  );
}
