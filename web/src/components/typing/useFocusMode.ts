"use client";

import { useEffect } from "react";
import type { TypingSession } from "@/lib/engine/session";

/**
 * While a test runs, marks <html data-typing="on"> so chrome tagged `.focus-fade`
 * (header, restart hint) dims out of the way. Cleared on finish, restart and unmount.
 */
export function useFocusMode(phase: ReturnType<TypingSession["getPhase"]>) {
  useEffect(() => {
    const root = document.documentElement;
    if (phase === "running") root.dataset.typing = "on";
    else delete root.dataset.typing;
    return () => {
      delete root.dataset.typing;
    };
  }, [phase]);
}
