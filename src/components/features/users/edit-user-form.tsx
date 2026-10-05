"use client";

import { startTransition, useActionState } from "react";
import { UserDetailsFields } from "@/components/features/users/user-details-fields";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import type { Role, UserType } from "@/lib/roles";
import { updateUser, type UpdateUserState } from "@/server/actions/users";

export function EditUserForm({
  user,
  roleOptions,
  roleLocked,
}: {
  user: {
    id: string;
    employeeId: string;
    fullName: string;
    role: Role;
    userType: UserType | null;
  };
  roleOptions: Role[];
  roleLocked: boolean;
}) {
  const [state, formAction, isPending] = useActionState<
    UpdateUserState,
    FormData
  >(updateUser, undefined);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="max-w-md space-y-5"
    >
      <input type="hidden" name="userId" value={user.id} />
      <UserDetailsFields
        defaultValues={user}
        roleOptions={roleOptions}
        roleLocked={roleLocked}
      />
      {state?.status === "error" && <FormMessage>{state.message}</FormMessage>}
      {state?.status === "saved" && (
        <FormMessage tone="success">Changes saved.</FormMessage>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
