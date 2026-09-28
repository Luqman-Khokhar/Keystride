"use client";

import { useEffect, useRef } from "react";
import type { ResultSubmission, TestResult } from "@/lib/engine/types";
import { ghostButtonCls, primaryButtonCls } from "@/components/ui/states";
import { ResultChart } from "./ResultChart";
import { SaveStatus } from "./SaveStatus";
import { useCountUp } from "./useCountUp";

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
  finalValue,
}: {
  label: string;
  value: string;
  hint?: string;
  big?: boolean;
  /** Set when `value` is animating: screen readers get this instead of the moving digits. */
  finalValue?: string;
}) {
  return (
    <div title={hint}>
      <dt className={big ? "text-lg font-medium text-sub" : "text-sm text-sub"}>{label}</dt>
      <dd className={big ? "font-mono text-6xl leading-none tabular-nums text-main" : "font-mono text-2xl tabular-nums text-text"}>
        {finalValue === undefined ? (
          value
        ) : (
          <>
            <span aria-hidden="true">{value}</span>
            <span className="sr-only">{finalValue}</span>
          </>
        )}
      </dd>
    </div>
  );
}

/** Staggered entrance delay for each result block (paired with the rise-in class). */
const delay = (i: number) => ({ animationDelay: `${i * 60}ms` });

const kbdCls = "rounded border border-current/30 px-1.5 font-mono text-xs opacity-80";

export function Results({
  result,
  submission,
  onNext,
  onRepeat,
  nextLabel = "Next test",
  saveStatus,
}: ResultsProps) {
  const nextRef = useRef<HTMLButtonElement>(null);
  const wpm = useCountUp(Math.round(result.wpm));
  const accuracy = useCountUp(Math.round(result.accuracy));

  useEffect(() => {
    nextRef.current?.focus();
  }, []);

  const { chars, config } = result;
  const charParts: [number, string, string][] = [
    [chars.correct, "correct", "text-text"],
    [chars.incorrect, "wrong", chars.incorrect ? "text-error" : "text-text"],
    [chars.extra, "extra", chars.extra ? "text-error-extra" : "text-text"],
    [chars.missed, "missed", "text-text"],
  ];
  const testType = `${config.mode} ${config.amount}${config.punctuation ? " · punctuation" : ""}${
    config.numbers ? " · numbers" : ""
  } · ${config.language}`;

  if (result.durationMs < 1000 || result.keystrokes.length === 0) {
    return (
      <section aria-labelledby="result-heading" className="rise-in flex flex-col items-center gap-4 text-center">
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

      <div className="rise-in grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr] md:items-center" style={delay(0)}>
        <dl className="flex gap-8 md:flex-col md:gap-4">
          <Stat big label="WPM" value={String(wpm)} finalValue={String(Math.round(result.wpm))} hint={`${result.wpm} wpm`} />
          <Stat
            big
            label="Accuracy"
            value={`${accuracy}%`}
            finalValue={`${Math.round(result.accuracy)}%`}
            hint={`${result.accuracy}% accuracy`}
          />
        </dl>
        <ResultChart samples={result.samples} />
      </div>

      <dl
        className="rise-in grid grid-cols-2 gap-x-4 gap-y-5 border-t border-line pt-6 sm:grid-cols-4 lg:grid-cols-6"
        style={delay(1)}
      >
        <div className="col-span-2 sm:col-span-4 lg:col-span-1">
          <dt className="text-sm text-sub">Test type</dt>
          <dd className="text-text">{testType}</dd>
        </div>
        <Stat label="Raw" value={String(Math.round(result.rawWpm))} hint="Speed counting every typed character, including mistakes" />
        <Stat label="Consistency" value={`${Math.round(result.consistency)}%`} hint="How steady your speed was, second to second" />
        <Stat label="Time" value={`${(result.durationMs / 1000).toFixed(result.durationMs % 1000 ? 1 : 0)}s`} />
        <div className="col-span-2 sm:col-span-4 lg:col-span-2">
          <dt className="text-sm text-sub">Characters</dt>
          <dd className="flex flex-wrap gap-x-3 text-sm text-sub">
            {charParts.map(([n, label, cls]) => (
              <span key={label}>
                <span className={`font-mono text-2xl tabular-nums ${cls}`}>{n}</span> {label}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      <div className="rise-in" style={delay(2)}>
        {saveStatus ?? (submission && <SaveStatus submission={submission} />)}
      </div>

      <div className="rise-in flex flex-wrap justify-center gap-2" style={delay(3)}>
        <button ref={nextRef} type="button" onClick={onNext} className={primaryButtonCls}>
          {nextLabel}
          <kbd aria-hidden="true" className={kbdCls}>
            enter
          </kbd>
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
