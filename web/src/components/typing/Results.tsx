"use client";

import { useEffect, useRef } from "react";
import type { ResultSubmission, TestResult } from "@/lib/engine/types";
import { ghostButtonCls, primaryButtonCls } from "@/components/ui/states";
import { ResultChart } from "./ResultChart";
import { SaveStatus } from "./SaveStatus";

interface ResultsProps {
  result: TestResult;
  submission: ResultSubmission | null;
  onNext: () => void;
  /** Hidden when omitted. */
  onRepeat?: () => void;
  nextLabel?: string;
  /** Replaces the default "save to history" status (e.g. competition attempts). */
  saveStatus?: React.ReactNode;
}

function Stat({
  label,
  value,
  hint,
  big = false,
}: {
  label: string;
  value: string;
  hint?: string;
  big?: boolean;
}) {
  return (
    <div title={hint}>
      <dt className={big ? "text-lg font-medium text-sub" : "text-sm text-sub"}>{label}</dt>
      <dd className={big ? "font-mono text-6xl leading-none text-main" : "font-mono text-2xl text-text"}>{value}</dd>
    </div>
  );
}

export function Results({
  result,
  submission,
  onNext,
  onRepeat,
  nextLabel = "Next test",
  saveStatus,
}: ResultsProps) {
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    nextRef.current?.focus();
  }, []);

  const { chars, config } = result;
  const testType = `${config.mode} ${config.amount}${config.punctuation ? " · punctuation" : ""}${
    config.numbers ? " · numbers" : ""
  } · ${config.language}`;

  if (result.durationMs < 1000 || result.keystrokes.length === 0) {
    return (
      <section aria-labelledby="result-heading" className="flex flex-col items-center gap-4 text-center">
        <h2 id="result-heading" className="text-xl font-semibold text-text">
          Test too short to score
        </h2>
        <p className="text-sub">Type for at least a second to get a result.</p>
        <button ref={nextRef} type="button" onClick={onNext} className={primaryButtonCls}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="result-heading" className="flex w-full flex-col gap-6">
      <h2 id="result-heading" className="sr-only">
        Test result
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr] md:items-center">
        <dl className="flex gap-8 md:flex-col md:gap-4">
          <Stat big label="WPM" value={String(Math.round(result.wpm))} hint={`${result.wpm} wpm`} />
          <Stat big label="Accuracy" value={`${Math.round(result.accuracy)}%`} hint={`${result.accuracy}% accuracy`} />
        </dl>
        <ResultChart samples={result.samples} />
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-sm text-sub">Test type</dt>
          <dd className="text-text">{testType}</dd>
        </div>
        <Stat label="Raw" value={String(Math.round(result.rawWpm))} hint="Speed counting every typed character, including mistakes" />
        <Stat
          label="Characters"
          value={`${chars.correct}/${chars.incorrect}/${chars.extra}/${chars.missed}`}
          hint="correct / incorrect / extra / missed"
        />
        <Stat label="Consistency" value={`${Math.round(result.consistency)}%`} hint="How steady your speed was, second to second" />
        <Stat label="Time" value={`${(result.durationMs / 1000).toFixed(result.durationMs % 1000 ? 1 : 0)}s`} />
      </dl>

      {saveStatus ?? (submission && <SaveStatus submission={submission} />)}

      <div className="flex flex-wrap justify-center gap-2">
        <button ref={nextRef} type="button" onClick={onNext} className={primaryButtonCls}>
          {nextLabel}
        </button>
        {onRepeat && (
          <button type="button" onClick={onRepeat} className={ghostButtonCls}>
            Repeat test
          </button>
        )}
      </div>
    </section>
  );
}
