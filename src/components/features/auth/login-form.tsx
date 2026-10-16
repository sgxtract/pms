"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "@/server/actions/auth";

const NEU_INPUT =
  "h-11 rounded-xl border border-neu-edge bg-neu px-4 neu-inset";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="employeeId">Employee ID</Label>
        <Input
          id="employeeId"
          name="employeeId"
          autoComplete="username"
          autoCapitalize="characters"
          spellCheck={false}
          defaultValue={state?.employeeId}
          className={NEU_INPUT}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className={NEU_INPUT}
          required
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="rounded-xl bg-neu px-4 py-3 text-sm text-danger-soft-foreground neu-inset"
        >
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        variant="neu"
        size="lg"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
