"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { TemporaryPasswordNotice } from "@/components/features/users/temporary-password-notice";
import { UserDetailsFields } from "@/components/features/users/user-details-fields";
import { Button, buttonClasses } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import type { Role } from "@/lib/roles";
import { createUser, type CreateUserState } from "@/server/actions/users";

export function CreateUserForm({ roleOptions }: { roleOptions: Role[] }) {
  const [state, formAction, isPending] = useActionState<
    CreateUserState,
    FormData
  >(createUser, undefined);
  const [acknowledged, setAcknowledged] = useState<CreateUserState>(undefined);

  if (state?.status === "created" && state !== acknowledged) {
    return (
      <div className="max-w-xl space-y-6">
        <TemporaryPasswordNotice
          title="Account created"
          fullName={state.fullName}
          employeeId={state.employeeId}
          password={state.temporaryPassword}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setAcknowledged(state)}>
            Add another user
          </Button>
          <Link
            href="/users"
            className={buttonClasses({ variant: "secondary" })}
          >
            Back to users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="max-w-md space-y-5"
    >
      <UserDetailsFields roleOptions={roleOptions} />
      {state?.status === "error" && <FormMessage>{state.message}</FormMessage>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
