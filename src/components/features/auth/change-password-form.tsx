"use client";

import { Check, X } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_RULES } from "@/lib/validation/password";
import { cn } from "@/lib/utils";
import {
  changePassword,
  type ChangePasswordState,
} from "@/server/actions/account";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState<
    ChangePasswordState,
    FormData
  >(changePassword, undefined);
  const [newPassword, setNewPassword] = useState("");

  return (
    <form
      action={formAction}
      onReset={() => setNewPassword("")}
      className="mt-8 space-y-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          aria-describedby="password-requirements"
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />
        <ul id="password-requirements" className="space-y-1 pt-1 text-sm">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(newPassword);
            return (
              <li
                key={rule.label}
                className={cn(
                  "flex items-center gap-2",
                  met
                    ? "text-success-soft-foreground"
                    : "text-muted-foreground",
                )}
              >
                {met ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <X className="size-4" aria-hidden />
                )}
                <span>{rule.label}</span>
                <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
