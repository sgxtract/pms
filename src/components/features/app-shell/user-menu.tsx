"use client";

import { ChevronsUpDown, KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ThemeChoice } from "@/components/features/app-shell/theme-choice";
import { cn } from "@/lib/utils";
import { logout } from "@/server/actions/auth";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const ITEM_CLASSES = cn(
  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
  "hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-ring",
  "[&_svg]:size-4 [&_svg]:shrink-0",
);

export function UserMenu({
  name,
  roleLabel,
  placement,
}: {
  name: string;
  roleLabel: string;
  placement: "up" | "down";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // While open: close on Escape or on a click outside the menu.
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const avatar = (
    <span
      aria-hidden
      className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground/10 text-xs font-semibold text-foreground"
    >
      {initials(name)}
    </span>
  );

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        // Close when keyboard focus leaves the menu.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={
          placement === "down" ? `Account menu for ${name}` : undefined
        }
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "flex items-center gap-3 rounded-md text-left transition-colors hover:bg-surface-muted",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          placement === "up" ? "w-full p-2" : "p-1",
        )}
      >
        {avatar}
        {placement === "up" && (
          <>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {roleLabel}
              </span>
            </span>
            <ChevronsUpDown
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </>
        )}
      </button>

      <div
        id={panelId}
        hidden={!isOpen}
        tabIndex={-1}
        className={cn(
          "absolute z-50 rounded-2xl border border-foreground/10 bg-surface p-1.5 shadow-[var(--shadow-float)]",
          placement === "up"
            ? "inset-x-0 bottom-full mb-2"
            : "top-full right-0 mt-2 w-64",
        )}
      >
        <div className="px-3 py-2">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
        </div>
        <div className="my-1 border-t border-foreground/10" />

        <Link
          href="/change-password"
          onClick={() => setIsOpen(false)}
          className={ITEM_CLASSES}
        >
          <KeyRound aria-hidden />
          Change password
        </Link>

        <div className="px-3 py-2">
          <p className="mb-1.5 text-xs text-muted-foreground">Theme</p>
          <ThemeChoice />
        </div>
        <div className="my-1 border-t border-foreground/10" />

        <form action={logout}>
          <button type="submit" className={ITEM_CLASSES}>
            <LogOut aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
