"use client";

import { useActionState, useState } from "react";
import { TemporaryPasswordNotice } from "@/components/features/users/temporary-password-notice";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import {
  resetUserPassword,
  type ResetPasswordState,
} from "@/server/actions/users";

export function ResetPasswordPanel({
  userId,
  fullName,
}: {
  userId: string;
  fullName: string;
}) {
  const [state, formAction, isPending] = useActionState<
    ResetPasswordState,
    FormData
  >(resetUserPassword, undefined);
  const [isConfirming, setIsConfirming] = useState(false);
  const [acknowledged, setAcknowledged] =
    useState<ResetPasswordState>(undefined);

  if (state?.status === "reset" && state !== acknowledged) {
    return (
      <div className="max-w-xl space-y-4">
        <TemporaryPasswordNotice
          title="Password reset"
          fullName={state.fullName}
          employeeId={state.employeeId}
          password={state.temporaryPassword}
        />
        <Button
          variant="secondary"
          onClick={() => {
            setAcknowledged(state);
            setIsConfirming(false);
          }}
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-muted-foreground">
        Resetting gives {fullName} a new temporary password and signs them out
        everywhere. They&apos;ll choose a new password at their next sign-in.
      </p>

      {state?.status === "error" && <FormMessage>{state.message}</FormMessage>}

      {isConfirming ? (
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="userId" value={userId} />
          <Button type="submit" variant="danger" disabled={isPending} autoFocus>
            {isPending ? "Resetting…" : "Yes, reset password"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsConfirming(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <Button variant="secondary" onClick={() => setIsConfirming(true)}>
          Reset password
        </Button>
      )}
    </div>
  );
}
