"use client";

import { useActionState, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import {
  setAccountActive,
  type AccountStatusState,
} from "@/server/actions/users";

export function AccountStatusPanel({
  userId,
  fullName,
  isActive,
}: {
  userId: string;
  fullName: string;
  isActive: boolean;
}) {
  const [state, formAction, isPending] = useActionState<
    AccountStatusState,
    FormData
  >(setAccountActive, undefined);
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <span>Status:</span>
        {isActive ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge>Disabled</Badge>
        )}
      </div>

      {state?.status === "error" && <FormMessage>{state.message}</FormMessage>}
      {state?.status === "updated" && (
        <FormMessage tone="success">
          {state.isActive
            ? "Account enabled. They can sign in with their existing password."
            : "Account disabled. They have been signed out."}
        </FormMessage>
      )}

      {isActive && !isConfirming && (
        <Button variant="secondary" onClick={() => setIsConfirming(true)}>
          Disable account
        </Button>
      )}

      {isActive && isConfirming && (
        <form
          action={formAction}
          onSubmit={() => setIsConfirming(false)}
          className="space-y-3"
        >
          <p className="text-sm text-muted-foreground">
            Disabling signs {fullName} out immediately and stops them from
            signing in. Their records and history are kept, and the account can
            be enabled again.
          </p>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="active" value="false" />
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              variant="danger"
              disabled={isPending}
              autoFocus
            >
              {isPending ? "Disabling…" : "Yes, disable account"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsConfirming(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {!isActive && (
        <form action={formAction}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="active" value="true" />
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enabling…" : "Enable account"}
          </Button>
        </form>
      )}
    </div>
  );
}
