"use client";

import { startTransition, useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PR_FORM_FIELDS,
  type PrFormField,
} from "@/lib/validation/procurement-request";
import {
  createProcurementRequest,
  type CreatePrState,
} from "@/server/actions/procurement";
import type { Option, PrSuggestions } from "@/server/queries/procurement";

type CreatePrFormProps = {
  options: { types: Option[]; categories: Option[]; modes: Option[] };
  suggestions: PrSuggestions;
  today: string;
  defaultReceivedAt: string;
};

function Suggestions({ id, values }: { id: string; values: string[] }) {
  return (
    <datalist id={id}>
      {values.map((value) => (
        <option key={value} value={value} />
      ))}
    </datalist>
  );
}

export function CreatePrForm({
  options,
  suggestions,
  today,
  defaultReceivedAt,
}: CreatePrFormProps) {
  const [state, formAction, isPending] = useActionState<
    CreatePrState,
    FormData
  >(createProcurementRequest, undefined);

  const errors = state?.fieldErrors ?? {};

  // Accessibility attributes that connect a field to its hint or error.
  const describe = (field: PrFormField, hasHint = false) => ({
    id: field,
    name: field,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field]
      ? `${field}-error`
      : hasHint
        ? `${field}-hint`
        : undefined,
  });

  // After a failed submit, move focus to the first field that needs fixing.
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
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-lg font-semibold">PR details</legend>

        <Field id="prNumber" label="PR Number" error={errors.prNumber}>
          <Input
            {...describe("prNumber")}
            className="font-mono"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>

        <Field id="prDate" label="PR date" error={errors.prDate}>
          <Input
            {...describe("prDate")}
            type="date"
            defaultValue={today}
            max={today}
          />
        </Field>

        <Field
          id="referenceCode"
          label="Reference ID"
          optional
          hint="Only for PRs consolidated with others. A new Reference ID is created if it doesn't exist yet."
          error={errors.referenceCode}
          className="sm:col-span-2"
        >
          <Input
            {...describe("referenceCode", true)}
            list="referenceCode-suggestions"
            className="font-mono sm:max-w-xs"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
          <Suggestions
            id="referenceCode-suggestions"
            values={suggestions.referenceCodes}
          />
        </Field>

        <Field
          id="prTypeId"
          label="Type of PR"
          optional
          error={errors.prTypeId}
        >
          <Select {...describe("prTypeId")} defaultValue="">
            <option value="">Not specified</option>
            {options.types.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="prCategoryId" label="Category" error={errors.prCategoryId}>
          <Select {...describe("prCategoryId")} defaultValue="">
            <option value="" disabled>
              Choose a category
            </option>
            {options.categories.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        </Field>
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="mb-4 text-lg font-semibold">
          Requesting office and project
        </legend>

        <Field id="endUser" label="End-User" error={errors.endUser}>
          <Input
            {...describe("endUser")}
            list="endUser-suggestions"
            autoComplete="off"
          />
          <Suggestions id="endUser-suggestions" values={suggestions.endUsers} />
        </Field>

        <Field
          id="particulars"
          label="Particulars / Project name"
          error={errors.particulars}
        >
          <Textarea {...describe("particulars")} rows={3} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-lg font-semibold">Budget</legend>

        <Field
          id="abc"
          label="ABC (Approved Budget for the Contract)"
          hint="In pesos, for example 1,250,000.00"
          error={errors.abc}
          className="sm:col-span-2"
        >
          <Input
            {...describe("abc", true)}
            inputMode="decimal"
            autoComplete="off"
            className="tabular-nums sm:max-w-xs"
          />
        </Field>

        <Field
          id="sourceOfFunds"
          label="Source of Funds"
          error={errors.sourceOfFunds}
        >
          <Input
            {...describe("sourceOfFunds")}
            list="sourceOfFunds-suggestions"
            autoComplete="off"
          />
          <Suggestions
            id="sourceOfFunds-suggestions"
            values={suggestions.sourcesOfFunds}
          />
        </Field>

        <Field id="accountCode" label="Account Code" error={errors.accountCode}>
          <Input
            {...describe("accountCode")}
            list="accountCode-suggestions"
            className="font-mono"
            autoComplete="off"
            spellCheck={false}
          />
          <Suggestions
            id="accountCode-suggestions"
            values={suggestions.accountCodes}
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-lg font-semibold">Procurement</legend>

        <Field
          id="procurementModeId"
          label="Procurement Mode"
          optional
          error={errors.procurementModeId}
        >
          <Select {...describe("procurementModeId")} defaultValue="">
            <option value="">Not specified</option>
            {options.modes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id="calendarDays"
          label="Calendar Days"
          optional
          hint="Delivery period, counted from the Notice to Proceed."
          error={errors.calendarDays}
        >
          <Input
            {...describe("calendarDays", true)}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            className="tabular-nums"
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-lg font-semibold">Receipt</legend>

        <Field
          id="receivedAt"
          label="Received by the PBAC"
          hint="Change this if you're encoding the PR after it arrived."
          error={errors.receivedAt}
        >
          <Input
            {...describe("receivedAt", true)}
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
          <Textarea {...describe("remarks")} rows={2} />
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
