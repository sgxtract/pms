"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "@/server/actions/auth";
import { GLASS_FIELD } from "@/components/ui/glass-field";
import { cn } from "@/lib/utils";

const GLASS_INPUT = cn(GLASS_FIELD, "h-11 px-4");

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
          className={GLASS_INPUT}
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
          className={GLASS_INPUT}
          required
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger-soft-foreground"
        >
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        variant="ink"
        size="lg"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
