"use client";

import { startTransition, useActionState, useEffect } from "react";
import { PrDetailsFields } from "@/components/features/procurement/pr-details-fields";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fieldAria } from "@/lib/field-aria";
import { PR_FORM_FIELDS } from "@/lib/validation/procurement-request";
import {
  createProcurementRequest,
  type CreatePrState,
} from "@/server/actions/procurement";
import type { Option, PrSuggestions } from "@/server/queries/procurement";

export function CreatePrForm({
  options,
  suggestions,
  today,
  defaultReceivedAt,
}: {
  options: { types: Option[]; categories: Option[]; modes: Option[] };
  suggestions: PrSuggestions;
  today: string;
  defaultReceivedAt: string;
}) {
  const [state, formAction, isPending] = useActionState<
    CreatePrState,
    FormData
  >(createProcurementRequest, undefined);
  const errors = state?.fieldErrors ?? {};

  useEffect(() => {
    if (!state?.fieldErrors) return;
    const firstInvalid = PR_FORM_FIELDS.find(
      (field) => state.fieldErrors?.[field],
    );
    if (firstInvalid) document.getElementById(firstInvalid)?.focus();
  }, [state]);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="max-w-3xl space-y-10"
    >
      <PrDetailsFields
        options={options}
        suggestions={suggestions}
        errors={errors}
        today={today}
      />

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-lg font-semibold">Receipt</legend>

        <Field
          id="receivedAt"
          label="Received by the PBAC"
          hint="Change this if you're encoding the PR after it arrived."
          error={errors.receivedAt}
        >
          <Input
            {...fieldAria(errors, "receivedAt", true)}
            type="datetime-local"
            defaultValue={defaultReceivedAt}
          />
        </Field>

        <Field
          id="remarks"
          label="Remarks"
          optional
          error={errors.remarks}
          className="sm:col-span-2"
        >
          <Textarea {...fieldAria(errors, "remarks")} rows={2} />
        </Field>
      </fieldset>

      <div className="space-y-4 border-t pt-6">
        {state?.error && <FormMessage>{state.error}</FormMessage>}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Create PR"}
        </Button>
      </div>
    </form>
  );
}
