"use client";

import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Textarea } from "@/components/ui/textarea";
import {
  changePrStatus,
  type StatusChangeState,
} from "@/server/actions/procurement";

export function PrStatusPanel({
  prId,
  isCancelled,
}: {
  prId: string;
  isCancelled: boolean;
}) {
  const [state, formAction, isPending] = useActionState<
    StatusChangeState,
    FormData
  >(changePrStatus, undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [handled, setHandled] = useState<StatusChangeState>(undefined);

  const isNew = state !== handled;
  const justChanged = state?.status === "changed" && isNew;
  const remarksError =
    state?.status === "error" && isNew ? state.remarksError : undefined;

  function open() {
    setHandled(state);
    setIsOpen(true);
  }

  if (!isOpen || justChanged) {
    return (
      <div className="space-y-3">
        {justChanged && state?.status === "changed" && (
          <FormMessage tone="success">
            {state.newStatus === "cancelled"
              ? "PR cancelled. It can be restored at any time."
              : "PR restored. It's back at the same stage as before."}
          </FormMessage>
        )}
        {isCancelled ? (
          <Button onClick={open}>Restore PR</Button>
        ) : (
          <Button variant="secondary" onClick={open}>
            Cancel PR
          </Button>
        )}
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="max-w-xl space-y-4 rounded-lg border bg-surface p-5"
    >
      <input type="hidden" name="prId" value={prId} />
      <input
        type="hidden"
        name="intent"
        value={isCancelled ? "restore" : "cancel"}
      />

      <p className="text-sm text-muted-foreground">
        {isCancelled
          ? "Restoring makes the PR active again, at the same stage it had when it was cancelled."
          : "A cancelled PR can't be edited or moved until it's restored. Its details and history are kept."}
      </p>

      <Field
        id="statusRemarks"
        label={isCancelled ? "Reason for restoring" : "Reason for cancelling"}
        error={remarksError}
      >
        <Textarea
          id="statusRemarks"
          name="remarks"
          rows={3}
          aria-invalid={remarksError ? true : undefined}
          aria-describedby={remarksError ? "statusRemarks-error" : undefined}
          autoFocus
        />
      </Field>

      {state?.status === "error" && isNew && !remarksError && (
        <FormMessage>{state.message}</FormMessage>
      )}

      <div className="flex flex-wrap gap-2">
        {isCancelled ? (
          <Button type="submit" disabled={isPending}>
            {isPending ? "Restoring…" : "Restore PR"}
          </Button>
        ) : (
          <Button type="submit" variant="danger" disabled={isPending}>
            {isPending ? "Cancelling…" : "Yes, cancel PR"}
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => setIsOpen(false)}
          disabled={isPending}
        >
          {isCancelled ? "Go back" : "Keep PR"}
        </Button>
      </div>
    </form>
  );
}
