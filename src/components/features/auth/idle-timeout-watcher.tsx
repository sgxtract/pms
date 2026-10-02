"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { IDLE_TIMEOUT_SECONDS } from "@/lib/auth-config";
import {
  extendSession,
  logout,
  logoutDueToInactivity,
} from "@/server/actions/auth";

const WARNING_SECONDS = 2 * 60;
const MIN_EXTEND_INTERVAL_MS = 60 * 1000;
const CHANNEL_NAME = "pms-session";
const TIMEOUT_URL = "/login?reason=timeout";
const ACTIVITY_EVENTS = [
  "mousemove",
  "pointerdown",
  "keydown",
  "scroll",
  "touchstart",
] as const;

type ChannelMessage = { type: "extended"; at: number } | { type: "timed-out" };

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// A full page load is intentional: it clears all client-side state and
// cached pages after the session ends. replace() also removes the
// protected page from the Back button history.
function goToLogin() {
  window.location.replace(TIMEOUT_URL);
}

export function IdleTimeoutWatcher() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastExtendedAt = useRef(0);
  const isExtending = useRef(false);
  const isSigningOut = useRef(false);

  const extend = useCallback(async () => {
    if (isExtending.current) return;
    isExtending.current = true;

    try {
      const result = await extendSession();
      if (!result.ok) {
        goToLogin();
        return;
      }
      const now = Date.now();
      lastExtendedAt.current = now;
      channelRef.current?.postMessage({ type: "extended", at: now });
      setSecondsLeft(null);
    } finally {
      isExtending.current = false;
    }
  }, []);

  // Share session updates between open tabs.
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
      if (event.data.type === "extended") {
        lastExtendedAt.current = Math.max(
          lastExtendedAt.current,
          event.data.at,
        );
        setSecondsLeft(null);
      } else {
        goToLogin();
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  // Activity keeps the session alive, but not while the warning is open.
  useEffect(() => {
    function handleActivity() {
      if (dialogRef.current?.open) return;
      if (Date.now() - lastExtendedAt.current > MIN_EXTEND_INTERVAL_MS) {
        void extend();
      }
    }

    const options = { passive: true, capture: true };
    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, options);
    }
    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity, options);
      }
    };
  }, [extend]);

  // Count down once per second.
  useEffect(() => {
    lastExtendedAt.current = Date.now();

    const interval = window.setInterval(async () => {
      const elapsedSeconds = (Date.now() - lastExtendedAt.current) / 1000;
      const remaining = Math.ceil(IDLE_TIMEOUT_SECONDS - elapsedSeconds);

      if (remaining <= 0) {
        if (isSigningOut.current) return;
        isSigningOut.current = true;
        window.clearInterval(interval);
        channelRef.current?.postMessage({ type: "timed-out" });
        await logoutDueToInactivity();
        goToLogin();
        return;
      }

      setSecondsLeft(remaining <= WARNING_SECONDS ? remaining : null);
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  // Open or close the dialog to match the countdown.
  const isWarning = secondsLeft !== null;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isWarning && !dialog.open) dialog.showModal();
    if (!isWarning && dialog.open) dialog.close();
  }, [isWarning]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="idle-warning-title"
      aria-describedby="idle-warning-description"
      onCancel={(event) => {
        // Pressing Escape counts as "Stay signed in".
        event.preventDefault();
        void extend();
      }}
      className="m-auto w-full max-w-sm rounded-xl border bg-surface p-6 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <h2 id="idle-warning-title" className="text-lg font-semibold">
        Are you still there?
      </h2>
      <p
        id="idle-warning-description"
        className="mt-2 text-sm text-muted-foreground"
      >
        For security, you&apos;ll be signed out in{" "}
        <span className="font-medium text-foreground tabular-nums">
          {formatCountdown(secondsLeft ?? 0)}
        </span>{" "}
        because of inactivity.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <form action={logout}>
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
        <Button onClick={() => void extend()} autoFocus>
          Stay signed in
        </Button>
      </div>
    </dialog>
  );
}
