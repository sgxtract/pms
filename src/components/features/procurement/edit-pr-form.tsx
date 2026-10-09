"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect } from "react";
import {
  PrDetailsFields,
  type PrDetailsDefaults,
} from "@/components/features/procurement/pr-details-fields";
import { Button, buttonClasses } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { PR_EDIT_FIELDS } from "@/lib/validation/procurement-request";
import {
  updateProcurementRequest,
  type UpdatePrState,
} from "@/server/actions/procurement";
import type { Option, PrSuggestions } from "@/server/queries/procurement";

export function EditPrForm({
  prId,
  version,
  defaults,
  options,
  suggestions,
  today,
}: {
  prId: string;
  version: string;
  defaults: PrDetailsDefaults;
  options: { types: Option[]; categories: Option[]; modes: Option[] };
  suggestions: PrSuggestions;
  today: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    UpdatePrState,
    FormData
  >(updateProcurementRequest, undefined);
  const errors = state?.fieldErrors ?? {};

  useEffect(() => {
    if (!state?.fieldErrors) return;
    const firstInvalid = PR_EDIT_FIELDS.find(
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
      <input type="hidden" name="prId" value={prId} />
      <input type="hidden" name="version" value={version} />

      <PrDetailsFields
        options={options}
        suggestions={suggestions}
        errors={errors}
        today={today}
        defaults={defaults}
      />

      <div className="space-y-4 border-t pt-6">
        {state?.status === "error" && (
          <FormMessage tone={state.conflict ? "warning" : "error"}>
            <p>{state.message}</p>
            {state.conflict && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => router.refresh()}
              >
                Reload latest details
              </Button>
            )}
          </FormMessage>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
          <Link
            href={`/requests/${prId}`}
            className={buttonClasses({ variant: "secondary" })}
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
