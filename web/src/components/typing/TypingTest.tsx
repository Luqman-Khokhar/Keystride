"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { loadConfig, saveConfig } from "@/lib/engine/config";
import { TypingSession } from "@/lib/engine/session";
import type { TestConfig } from "@/lib/engine/types";
import { ConfigBar } from "./ConfigBar";
import { LiveCounter } from "./LiveCounter";
import { Results } from "./Results";
import { TypingArea } from "./TypingArea";

interface TypingTestProps {
  /** Landing pages open in their own mode instead of the visitor's saved one. */
  initialConfig?: TestConfig;
}

export default function TypingTest({ initialConfig }: TypingTestProps) {
  const [config, setConfig] = useState<TestConfig>(() => initialConfig ?? loadConfig());
  const [session, setSession] = useState(() => new TypingSession(config));
  const phase = useSyncExternalStore(session.subscribe, session.getPhase, session.getPhase);
  const inputRef = useRef<HTMLInputElement>(null);

  const restart = useCallback((next: TestConfig, words?: string[]) => {
    if (inputRef.current) inputRef.current.value = "";
    setSession(new TypingSession(next, words));
  }, []);

  const onConfigChange = useCallback(
    (next: TestConfig) => {
      setConfig(next);
      saveConfig(next);
      restart(next);
    },
    [restart],
  );

  // Refocus the input whenever a fresh test is ready.
  useEffect(() => {
    if (phase === "idle") inputRef.current?.focus();
  }, [session, phase]);

  const onRestartClick = useCallback(() => restart(config), [restart, config]);

  if (phase === "finished" && session.result) {
    const words = session.config.mode === "words" ? session.words : session.words.slice(0, 90);
    return (
      <Results
        result={session.result}
        submission={session.submission}
        onNext={() => restart(config)}
        onRepeat={() => restart(session.config, words)}
      />
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <ConfigBar config={config} onChange={onConfigChange} dimmed={phase === "running"} />
      <div className="flex w-full flex-col gap-2">
        <LiveCounter session={session} />
        <TypingArea session={session} inputRef={inputRef} />
      </div>
      <button
        type="button"
        onClick={onRestartClick}
        aria-label="Restart test"
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
