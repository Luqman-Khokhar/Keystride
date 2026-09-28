"use client";

import { memo, useCallback, useSyncExternalStore } from "react";
import type { TypingSession } from "@/lib/engine/session";

interface WordProps {
  session: TypingSession;
  index: number;
  word: string;
}

/**
 * Subscribes to its own slot in the session, so a keystroke re-renders
 * exactly one word regardless of list length.
 */
export const Word = memo(function Word({ session, index, word }: WordProps) {
  const subscribe = useCallback(
    (fn: () => void) => session.subscribeWord(index, fn),
    [session, index],
  );
  const typed = useSyncExternalStore(
    subscribe,
    () => session.getTyped(index),
    () => "",
  );
  const status = useSyncExternalStore(
    subscribe,
    () => session.getStatus(index),
    () => "pending" as const,
  );

  const length = Math.max(word.length, typed.length);
  const letters = [];
  for (let i = 0; i < length; i++) {
    let cls = "letter";
    let ch: string;
    if (i >= word.length) {
      ch = typed[i];
      cls += " extra";
    } else {
      ch = word[i];
      if (i < typed.length) cls += typed[i] === ch ? " correct" : " incorrect";
    }
    letters.push(
      <span key={i} className={cls}>
        {ch}
      </span>,
    );
  }

  const hasError = status === "done" && typed !== word;

  return (
    <div data-i={index} className={hasError ? "word error" : "word"}>
      {letters}
    </div>
  );
});
