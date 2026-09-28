"use client";

import { useEffect, useRef } from "react";
import type { ResultSubmission, TestResult } from "@/lib/engine/types";
import { ResultChart } from "./ResultChart";
import { SaveStatus } from "./SaveStatus";

interface ResultsProps {
  result: TestResult;
  submission: ResultSubmission | null;
  onNext: () => void;
  onRepeat: () => void;
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
      <dt className={big ? "text-2xl text-sub" : "text-sm text-sub"}>{label}</dt>
      <dd className={big ? "text-6xl leading-none text-main" : "text-2xl text-main"}>{value}</dd>
    </div>
  );
}

export function Results({ result, submission, onNext, onRepeat }: ResultsProps) {
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    nextRef.current?.focus();
  }, []);

  const { chars, config } = result;
  const testType = `${config.mode} ${config.amount}${config.punctuation ? " · punctuation" : ""}${
    config.numbers ? " · numbers" : ""
  } · ${config.language}`;

  const btn =
    "rounded-lg px-4 py-2 text-sub transition-colors hover:bg-bg-alt hover:text-text focus-visible:outline-2 focus-visible:outline-main active:opacity-70";

  if (result.durationMs < 1000 || result.keystrokes.length === 0) {
    return (
      <section aria-labelledby="result-heading" className="flex flex-col items-center gap-4 text-center">
        <h2 id="result-heading" className="text-xl text-text">
          Test too short to score
        </h2>
        <p className="text-sub">Type for at least a second to get a result.</p>
        <button ref={nextRef} type="button" onClick={onNext} className={btn}>
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
          <Stat big label="wpm" value={String(Math.round(result.wpm))} hint={`${result.wpm} wpm`} />
          <Stat big label="acc" value={`${Math.round(result.accuracy)}%`} hint={`${result.accuracy}% accuracy`} />
        </dl>
        <ResultChart samples={result.samples} />
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-sm text-sub">test type</dt>
          <dd className="text-text">{testType}</dd>
        </div>
        <Stat label="raw" value={String(Math.round(result.rawWpm))} hint="Speed counting every typed character, including mistakes" />
        <Stat
          label="characters"
          value={`${chars.correct}/${chars.incorrect}/${chars.extra}/${chars.missed}`}
          hint="correct / incorrect / extra / missed"
        />
        <Stat label="consistency" value={`${Math.round(result.consistency)}%`} hint="How steady your speed was, second to second" />
        <Stat label="time" value={`${(result.durationMs / 1000).toFixed(result.durationMs % 1000 ? 1 : 0)}s`} />
      </dl>

      {submission && <SaveStatus submission={submission} />}

      <div className="flex flex-wrap justify-center gap-2">
        <button ref={nextRef} type="button" onClick={onNext} className={btn}>
          Next test
        </button>
        <button type="button" onClick={onRepeat} className={btn}>
          Repeat test
        </button>
      </div>
    </section>
  );
}
