"use client";

import { memo } from "react";
import {
  TIME_OPTIONS,
  WORD_OPTIONS,
  type TestConfig,
  type TestMode,
} from "@/lib/engine/types";

interface ConfigBarProps {
  config: TestConfig;
  onChange: (next: TestConfig) => void;
  dimmed: boolean;
}

function Toggle({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-control px-2 py-1 transition-colors duration-150 hover:text-text focus-visible:outline-2 focus-visible:outline-main active:translate-y-px disabled:opacity-40 motion-reduce:active:translate-y-0 ${
        pressed ? "text-main" : "text-sub"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 hidden h-4 w-0.5 rounded bg-sub-alt sm:block" />;
}

export const ConfigBar = memo(function ConfigBar({ config, onChange, dimmed }: ConfigBarProps) {
  const set = (patch: Partial<TestConfig>) => onChange({ ...config, ...patch });
  const setMode = (mode: TestMode) => {
    if (mode === config.mode) return;
    set({ mode, amount: mode === "time" ? 30 : 25 });
  };
  const amounts = config.mode === "time" ? TIME_OPTIONS : WORD_OPTIONS;

  return (
    <nav
      aria-label="Test settings"
      className={`flex max-w-full flex-wrap items-center justify-center gap-y-1 rounded-surface bg-bg-alt px-2 py-1 font-mono text-sm transition-opacity duration-300 ${
        dimmed ? "opacity-0 focus-within:opacity-100 hover:opacity-100" : ""
      }`}
    >
      <Toggle pressed={config.punctuation} onClick={() => set({ punctuation: !config.punctuation })}>
        @ punctuation
      </Toggle>
      <Toggle pressed={config.numbers} onClick={() => set({ numbers: !config.numbers })}>
        # numbers
      </Toggle>
      <Divider />
      <Toggle pressed={config.mode === "time"} onClick={() => setMode("time")}>
        time
      </Toggle>
      <Toggle pressed={config.mode === "words"} onClick={() => setMode("words")}>
        words
      </Toggle>
      <Divider />
      {amounts.map((n) => (
        <Toggle key={n} pressed={config.amount === n} onClick={() => set({ amount: n })}>
          <span className="sr-only">{config.mode === "time" ? "seconds: " : "words: "}</span>
          {n}
        </Toggle>
      ))}
    </nav>
  );
});
