"use client";

import { useGetMeQuery, useGetSummaryQuery } from "@/store/api";

export interface SpeedLevel {
  range: string;
  label: string;
  /** Lower bound in wpm. */
  from: number;
}

const MAX = 130;
const SHADES = ["bg-main/15", "bg-main/30", "bg-main/50", "bg-main/75", "bg-main"];

/** Benchmarks as a scale; signed-in visitors also see where their best 60 s result sits. */
export function SpeedScale({ levels }: { levels: SpeedLevel[] }) {
  const { data: user } = useGetMeQuery();
  const { data: summary } = useGetSummaryQuery(undefined, { skip: !user });
  const standard = summary?.bests.filter((b) => !b.config.punctuation && !b.config.numbers) ?? [];
  const best =
    standard.find((b) => b.config.mode === "time" && b.config.amount === 60) ??
    standard.reduce<(typeof standard)[number] | undefined>((a, b) => (!a || b.wpm > a.wpm ? b : a), undefined);
  const you = best ? Math.round(best.wpm) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative pt-7">
        {you !== null && (
          <span
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center text-xs font-medium text-text"
            // Clamped so the label never pokes past the column edge (no horizontal scroll).
            style={{ left: `${Math.min(92, Math.max(8, (you / MAX) * 100))}%` }}
          >
            You · {you}
            <span aria-hidden="true" className="mt-0.5 h-3 w-0.5 rounded-full bg-text" />
          </span>
        )}
        <div aria-hidden="true" className="flex h-3 overflow-hidden rounded-full">
          {levels.map((l, i) => {
            const to = levels[i + 1]?.from ?? MAX;
            return <span key={l.range} className={SHADES[i]} style={{ width: `${((to - l.from) / MAX) * 100}%` }} />;
          })}
        </div>
      </div>
      <ol className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-5">
        {levels.map((l, i) => (
          <li key={l.range} className="flex items-start gap-2 sm:flex-col sm:gap-1">
            <span aria-hidden="true" className={`mt-1.5 size-2.5 shrink-0 rounded-full sm:mt-0 ${SHADES[i]}`} />
            <span>
              <span className="block font-mono tabular-nums text-text">{l.range} wpm</span>
              <span className="text-sub">{l.label}</span>
            </span>
          </li>
        ))}
      </ol>
      {you !== null && (
        <p className="sr-only">
          Your best is {you} words per minute.
        </p>
      )}
    </div>
  );
}
