import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fieldAria } from "@/lib/field-aria";
import type { PrFormField } from "@/lib/validation/procurement-request";
import type { Option, PrSuggestions } from "@/server/queries/procurement";

export type PrDetailsDefaults = {
  prNumber: string;
  prDate: string;
  referenceCode: string | null;
  prTypeId: string | null;
  prCategoryId: string;
  endUser: string;
  particulars: string;
  abc: string;
  sourceOfFunds: string;
  procurementModeId: string | null;
  calendarDays: number | null;
  accountCode: string;
};

type Errors = Partial<Record<PrFormField, string>>;

function Suggestions({ id, values }: { id: string; values: string[] }) {
  return (
    <datalist id={id}>
      {values.map((value) => (
        <option key={value} value={value} />
      ))}
    </datalist>
  );
}

function OptionList({ options }: { options: Option[] }) {
  return options.map((option) => (
    <option key={option.id} value={option.id}>
      {option.name}
    </option>
  ));
}

export function PrDetailsFields({
  options,
  suggestions,
  errors,
  today,
  defaults,
}: {
  options: { types: Option[]; categories: Option[]; modes: Option[] };
  suggestions: PrSuggestions;
  errors: Errors;
  today: string;
  defaults?: PrDetailsDefaults;
}) {
  const aria = (field: PrFormField, hasHint = false) =>
    fieldAria(errors, field, hasHint);

  return (
    <>
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-lg font-semibold">PR details</legend>

        <Field id="prNumber" label="PR Number" error={errors.prNumber}>
          <Input
            {...aria("prNumber")}
            defaultValue={defaults?.prNumber}
            className="font-mono"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>

        <Field id="prDate" label="PR date" error={errors.prDate}>
          <Input
            {...aria("prDate")}
            type="date"
            defaultValue={defaults?.prDate ?? today}
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
            {...aria("referenceCode", true)}
            defaultValue={defaults?.referenceCode ?? ""}
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
          <Select {...aria("prTypeId")} defaultValue={defaults?.prTypeId ?? ""}>
            <option value="">Not specified</option>
            <OptionList options={options.types} />
          </Select>
        </Field>

        <Field id="prCategoryId" label="Category" error={errors.prCategoryId}>
          <Select
            {...aria("prCategoryId")}
            defaultValue={defaults?.prCategoryId ?? ""}
          >
            <option value="" disabled>
              Choose a category
            </option>
            <OptionList options={options.categories} />
          </Select>
        </Field>
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="mb-4 text-lg font-semibold">
          Requesting office and project
        </legend>

        <Field id="endUser" label="End-User" error={errors.endUser}>
          <Input
            {...aria("endUser")}
            defaultValue={defaults?.endUser}
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
          <Textarea
            {...aria("particulars")}
            defaultValue={defaults?.particulars}
            rows={3}
          />
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
            {...aria("abc", true)}
            defaultValue={defaults?.abc}
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
            {...aria("sourceOfFunds")}
            defaultValue={defaults?.sourceOfFunds}
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
            {...aria("accountCode")}
            defaultValue={defaults?.accountCode}
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
          <Select
            {...aria("procurementModeId")}
            defaultValue={defaults?.procurementModeId ?? ""}
          >
            <option value="">Not specified</option>
            <OptionList options={options.modes} />
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
            {...aria("calendarDays", true)}
            defaultValue={defaults?.calendarDays ?? ""}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            className="tabular-nums"
          />
        </Field>
      </fieldset>
    </>
  );
}
