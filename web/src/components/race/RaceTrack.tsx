"use client";

import { formatRaceTime, type RaceTrackStyle } from "@/lib/race";
import { Runner } from "./Runner";

export interface Lane {
  username: string;
  /** 1–4: which laser color. */
  color: number;
  /** 0–1. */
  p: number;
  wpm: number;
  isMe: boolean;
  online: boolean;
  finish: { place: number; finishMs: number } | null;
}

/** A pixel runner heading for the finish line, leaving a faint trail in its lane color. */
function RunnerProgress({ lane, compact }: { lane: Lane; compact: boolean }) {
  const state = lane.finish ? "win" : lane.online && lane.wpm > 0 && lane.p < 1 ? "run" : "idle";
  return (
    // The runner's own width is kept free on the right, so its nose meets the finish at 100%.
    <div aria-hidden="true" className={`absolute inset-y-0 left-0 ${compact ? "right-4" : "right-7"}`}>
      <span
        className={`laser-track absolute inset-x-0 bottom-1 h-px origin-left bg-(--lane) opacity-40 transition-transform ease-linear ${lane.isMe ? "duration-75" : "duration-150"}`}
        style={{ transform: `scaleX(${lane.p})` }}
      />
      <div
        className={`laser-track absolute inset-0 transition-transform ease-linear ${lane.isMe ? "duration-75" : "duration-150"}`}
        style={{ transform: `translateX(${lane.p * 100}%)` }}
      >
        <Runner
          color={lane.color}
          state={state}
          wpm={lane.wpm}
          className={`absolute left-0 ${compact ? "bottom-0 size-4" : "bottom-0.5 size-7"}`}
        />
      </div>
    </div>
  );
}

function LaserLane({ lane, variant }: { lane: Lane; variant: RaceTrackStyle }) {
  const pct = Math.round(lane.p * 100);
  return (
    <li
      className={`grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)_3rem] items-center gap-3 transition-opacity duration-300 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_5.5rem] ${
        lane.online || lane.finish ? "" : "opacity-40"
      }`}
      style={{ "--lane": `var(--lane-${lane.color})` } as React.CSSProperties}
    >
      <span className="flex min-w-0 items-center gap-2 text-sm">
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-(--lane)" />
        <span className={`truncate ${lane.isMe ? "font-medium text-text" : "text-sub"}`}>
          {lane.username}
          {lane.isMe && <span className="sr-only"> (you)</span>}
        </span>
      </span>

      <div
        role="progressbar"
        aria-label={`${lane.username}${lane.isMe ? " (you)" : ""}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={lane.finish ? `Finished ${lane.finish.place}` : `${pct}%${lane.online ? "" : ", offline"}`}
        className={`relative ${variant === "runners" ? "h-9" : "h-7"} overflow-hidden rounded-full bg-bg-alt px-3 ${lane.isMe ? "ring-1 ring-line-strong" : ""}`}
      >
        <span aria-hidden="true" className="absolute inset-y-1.5 right-3 w-px bg-line-strong" />
        <div className="relative h-full">
          {variant === "runners" ? (
            <RunnerProgress lane={lane} compact={false} />
          ) : (
          <div
            aria-hidden="true"
            className={`laser-track absolute inset-0 transition-transform ease-linear ${lane.isMe ? "duration-75" : "duration-150"}`}
            style={{ transform: `translateX(${(lane.p - 1) * 100}%)` }}
          >
            <span className="laser-beam absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2" />
            <span className="laser-head absolute top-1/2 right-0 size-2.5 translate-x-1/2 -translate-y-1/2 rounded-full" />
          </div>
          )}
        </div>
      </div>

      <span className="text-right text-xs tabular-nums">
        {lane.finish ? (
          <>
            <span className="font-mono text-sm text-(--lane)">#{lane.finish.place}</span>
            <span className="hidden text-sub sm:inline"> · {formatRaceTime(lane.finish.finishMs)}</span>
          </>
        ) : lane.online ? (
          <>
            <span className="text-text">{lane.wpm}</span>
            <span className="text-sub"> wpm</span>
          </>
        ) : (
          <span className="text-sub">offline</span>
        )}
      </span>
    </li>
  );
}

/** Thin lasers only, sat right above the text so they stay in side vision while typing. */
function CompactTrack({ lanes, variant }: { lanes: Lane[]; variant: RaceTrackStyle }) {
  return (
    <ol aria-label="Race progress" className="flex flex-col gap-1.5">
      {lanes.map((lane) => (
        <li
          key={lane.username}
          aria-label={`${lane.username}${lane.isMe ? " (you)" : ""}: ${
            lane.finish ? `finished ${lane.finish.place}` : `${Math.round(lane.p * 100)}%`
          }`}
          className={`relative ${variant === "runners" ? "h-4" : "h-2.5"} overflow-hidden rounded-full bg-bg-alt px-1.5 transition-opacity duration-300 ${
            lane.online || lane.finish ? "" : "opacity-40"
          }`}
          style={{ "--lane": `var(--lane-${lane.color})` } as React.CSSProperties}
        >
          <div className="relative h-full">
            {variant === "runners" ? (
              <RunnerProgress lane={lane} compact />
            ) : (
            <div
              aria-hidden="true"
              className={`laser-track absolute inset-0 transition-transform ease-linear ${lane.isMe ? "duration-75" : "duration-150"}`}
              style={{ transform: `translateX(${(lane.p - 1) * 100}%)` }}
            >
              <span className="laser-beam absolute inset-x-0 top-1/2 h-px -translate-y-1/2" />
              <span className="laser-head absolute top-1/2 right-0 size-1.5 translate-x-1/2 -translate-y-1/2 rounded-full" />
            </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** One glowing laser (or pixel runner) per player, racing to the finish line on the right. */
export function RaceTrack({
  lanes,
  variant = "laser",
  compact = false,
}: {
  lanes: Lane[];
  variant?: RaceTrackStyle;
  compact?: boolean;
}) {
  if (compact) return <CompactTrack lanes={lanes} variant={variant} />;
  return (
    <section aria-label="Race progress" className="rounded-surface border border-line bg-surface p-4 sm:p-5">
      <ol className="flex flex-col gap-3">
        {lanes.map((lane) => (
          <LaserLane key={lane.username} lane={lane} variant={variant} />
        ))}
      </ol>
    </section>
  );
}
