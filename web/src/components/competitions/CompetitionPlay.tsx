"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { TestConfig } from "@keystride/engine";
import { TypingSession } from "@/lib/engine/session";
import { LiveCounter } from "@/components/typing/LiveCounter";
import { Results } from "@/components/typing/Results";
import { TypingArea } from "@/components/typing/TypingArea";
import { AttemptStatus } from "./AttemptStatus";

interface CompetitionPlayProps {
  slug: string;
  config: TestConfig;
  words: string[];
  /** false once the attempt cap is reached. */
  canRetry: boolean;
}

/** The typing test, locked to the competition's settings and shared text. */
export default function CompetitionPlay({ slug, config, words, canRetry }: CompetitionPlayProps) {
  const newSession = useCallback(() => new TypingSession(config, words, { fixedWords: true }), [config, words]);
  const [session, setSession] = useState(newSession);
  const phase = useSyncExternalStore(session.subscribe, session.getPhase, session.getPhase);
  const inputRef = useRef<HTMLInputElement>(null);
  const [done, setDone] = useState(false);

  const restart = useCallback(() => {
    if (inputRef.current) inputRef.current.value = "";
    setSession(newSession());
  }, [newSession]);

  useEffect(() => {
    if (phase === "idle") inputRef.current?.focus();
  }, [session, phase]);

  if (done) {
    return (
      <p className="rounded-lg bg-bg-alt px-6 py-10 text-center text-sub">
        You&apos;ve used all your attempts. Your best score is in the standings.
      </p>
    );
  }

  if (phase === "finished" && session.result) {
    return (
      <Results
        result={session.result}
        submission={session.submission}
        onNext={canRetry ? restart : () => setDone(true)}
        nextLabel={canRetry ? "Try again" : "Done"}
        saveStatus={session.submission && <AttemptStatus slug={slug} submission={session.submission} />}
      />
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full flex-col gap-2">
        <LiveCounter session={session} />
        <TypingArea session={session} inputRef={inputRef} />
      </div>
      <button
        type="button"
        onClick={restart}
        aria-label="Restart attempt"
        className="rounded-lg p-3 text-sub transition-colors hover:text-text focus-visible:text-text focus-visible:outline-2 focus-visible:outline-main active:opacity-70"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
        </svg>
      </button>
    </div>
  );
}
