"use client";

import { Menu, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

export function MobileNav({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open navigation"
        onClick={() => dialogRef.current?.showModal()}
      >
        <Menu />
      </Button>

      <dialog
        ref={dialogRef}
        aria-label="Navigation"
        onClick={(event) => {
          // Close on a backdrop click, or after choosing a link.
          const target = event.target as HTMLElement;
          if (target === event.currentTarget || target.closest("a")) {
            event.currentTarget.close();
          }
        }}
        className="m-0 h-svh max-h-none w-72 max-w-[85vw] border-r bg-surface p-0 text-foreground backdrop:bg-black/50"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-heading font-semibold">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation"
              onClick={() => dialogRef.current?.close()}
            >
              <X />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">{children}</div>
        </div>
      </dialog>
    </>
  );
}
