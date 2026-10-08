"use client";

import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { nowForDateTimeInput } from "@/lib/dates";
import type { MoveStageField } from "@/lib/validation/stage-move";
import { movePrStage, type MoveStageState } from "@/server/actions/procurement";
import type { StageOption } from "@/server/queries/procurement";

export function MoveStagePanel({
  prId,
  currentStage,
  stages,
}: {
  prId: string;
  currentStage: { id: string; code: string; name: string; sortOrder: number };
  stages: StageOption[];
}) {
  const [state, formAction, isPending] = useActionState<
    MoveStageState,
    FormData
  >(movePrStage, undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [handled, setHandled] = useState<MoveStageState>(undefined);
  const [toStageId, setToStageId] = useState("");
  const [defaultEffectiveAt, setDefaultEffectiveAt] = useState("");

  const isNew = state !== handled;
  const justMoved = state?.status === "moved" && isNew;
  const errors =
    state?.status === "error" && isNew ? (state.fieldErrors ?? {}) : {};
  const target = stages.find((stage) => stage.id === toStageId);
  const movingBack =
    target !== undefined && target.sortOrder < currentStage.sortOrder;

  const describe = (field: MoveStageField, hasHint = false) => ({
    id: field,
    name: field,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field]
      ? `${field}-error`
      : hasHint
        ? `${field}-hint`
        : undefined,
  });

  const [confirmingComplete, setConfirmingComplete] = useState(false);

  const movingToCompleted = target?.code === "completed";
  const isReopening = currentStage.code === "completed";

  function open() {
    setHandled(state);
    setToStageId("");
    setConfirmingComplete(false);
    setDefaultEffectiveAt(nowForDateTimeInput());
    setIsOpen(true);
  }

  if (!isOpen || justMoved) {
    return (
      <div className="space-y-3">
        {justMoved && state?.status === "moved" && (
          <FormMessage tone="success">Moved to {state.toStage}.</FormMessage>
        )}
        <Button onClick={open}>Move to another stage</Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (movingToCompleted && !confirmingComplete) {
          setConfirmingComplete(true);
          return;
        }
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="max-w-xl space-y-5 rounded-lg border bg-surface p-5"
    >
      <input type="hidden" name="prId" value={prId} />
      <p className="text-sm">
        Currently at <span className="font-medium">{currentStage.name}</span>.
      </p>

      <Field id="toStageId" label="Move to" error={errors.toStageId}>
        <Select
          {...describe("toStageId")}
          value={toStageId}
          onChange={(event) => {
            setToStageId(event.target.value);
            setConfirmingComplete(false);
          }}
        >
          <option value="" disabled>
            Choose a stage
          </option>
          {stages.map((stage) => (
            <option
              key={stage.id}
              value={stage.id}
              disabled={stage.id === currentStage.id}
            >
              {stage.name}
              {stage.id === currentStage.id ? " (current)" : ""}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        id="effectiveAt"
        label="Effective date and time"
        hint="When the PR actually moved. Change it if you're recording this later."
        error={errors.effectiveAt}
      >
        <Input
          {...describe("effectiveAt", true)}
          type="datetime-local"
          defaultValue={defaultEffectiveAt}
        />
      </Field>

      <Field
        id="remarks"
        label="Remarks"
        optional={!movingBack}
        hint={
          isReopening
            ? "Explain why this completed PR is being reopened."
            : movingBack
              ? "Required when moving a PR back to an earlier stage."
              : undefined
        }
        error={errors.remarks}
      >
        <Textarea {...describe("remarks", movingBack)} rows={3} />
      </Field>

      {state?.status === "error" && isNew && (
        <FormMessage>{state.message}</FormMessage>
      )}

      <div className="flex flex-wrap gap-2">
        {confirmingComplete ? (
          <div className="space-y-3">
            <FormMessage tone="warning">
              <p className="font-medium">Mark this PR as completed?</p>
              <p>
                Once completed, only an Administrator or Moderator can reopen
                it.
              </p>
            </FormMessage>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isPending} autoFocus>
                {isPending ? "Saving…" : "Yes, mark as completed"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmingComplete(false)}
                disabled={isPending}
              >
                Go back
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving…"
                : isReopening
                  ? "Reopen PR"
                  : movingBack
                    ? "Move back"
                    : movingToCompleted
                      ? "Mark as completed"
                      : "Move PR"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
