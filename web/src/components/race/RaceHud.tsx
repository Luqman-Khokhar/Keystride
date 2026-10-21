"use client";

import type { Lane } from "./RaceTrack";

export interface PlaceChange {
  /** Bumps on every overtake, remounting the note so its animation replays. */
  n: number;
  text: string;
  /** Laser color of whoever caused it. */
  color: number;
}

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

/** "+1.2" / "−0.4": words ahead (+) or behind (−). */
const gap = (words: number) => `${words >= 0 ? "+" : "−"}${Math.abs(words).toFixed(1)}`;

interface Props {
  me: Lane;
  rivals: Lane[];
  place: number;
  totalWords: number;
  change: PlaceChange | null;
}

/**
 * The race at a glance, right above the text: your place, how far the nearest rival is,
 * and a short note when someone passes you (or you pass them).
 */
export function RaceHud({ me, rivals, place, totalWords, change }: Props) {
  const gapTo = (r: Lane) => (r.finish ? null : (r.p - me.p) * totalWords);
  // Nearest rival in front, or the one right behind when leading.
  const ahead = rivals.filter((r) => !r.finish && r.p > me.p).sort((a, b) => a.p - b.p)[0];
  const behind = rivals.filter((r) => !r.finish && r.p <= me.p).sort((a, b) => b.p - a.p)[0];
  const status = ahead
    ? `${((ahead.p - me.p) * totalWords).toFixed(1)} words behind ${ahead.username}`
    : behind
      ? `${((me.p - behind.p) * totalWords).toFixed(1)} words ahead`
      : rivals.some((r) => r.finish)
        ? "Keep going"
        : "";

  return (
    <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <div className="flex min-w-0 items-baseline gap-3" style={{ "--lane": `var(--lane-${me.color})` } as React.CSSProperties}>
        <span className="font-mono text-2xl text-(--lane) tabular-nums">{ordinal(place)}</span>
        <span className="truncate text-sm text-sub tabular-nums">{status}</span>
        {change && (
          <span
            key={change.n}
            aria-hidden="true"
            className="race-note truncate text-sm font-medium text-(--lane)"
            style={{ "--lane": `var(--lane-${change.color})` } as React.CSSProperties}
          >
            {change.text}
          </span>
        )}
      </div>

      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums" aria-label="Rivals">
        {rivals.map((r) => {
          const g = gapTo(r);
          return (
            <li
              key={r.username}
              className={`flex items-center gap-1.5 ${r.online || r.finish ? "" : "opacity-50"}`}
              style={{ "--lane": `var(--lane-${r.color})` } as React.CSSProperties}
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-(--lane)" />
              <span className="max-w-20 truncate text-sub">{r.username}</span>
              <span className={g !== null && g > 0 ? "text-text" : "text-sub"}>
                {r.finish ? `#${r.finish.place}` : g === null ? "" : gap(g)}
              </span>
            </li>
          );
        })}
        <li className="text-sub">
          <span className="text-text">{me.wpm}</span> wpm
        </li>
      </ul>

      {/* Screen readers hear place changes only, not every tick. */}
      <p className="sr-only" aria-live="polite">
        {change?.text ?? ""}
      </p>
    </div>
  );
}
