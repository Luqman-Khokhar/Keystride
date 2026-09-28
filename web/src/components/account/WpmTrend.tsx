"use client";

import { useGetHistoryInfiniteQuery } from "@/store/api";

const W = 100;
const H = 40;

/** Sparkline of WPM across the most recent verified tests (shares the history list's cache). */
export function WpmTrend() {
  const { data } = useGetHistoryInfiniteQuery();
  const points = (data?.pages[0]?.items ?? [])
    .filter((r) => !r.flagged)
    .reverse()
    .map((r) => r.wpm);

  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1, max - min);
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => H - 2 - ((v - min) / span) * (H - 4);
  const line = points.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join("");
  const avg = Math.round(points.reduce((a, b) => a + b, 0) / points.length);
  const last = Math.round(points[points.length - 1]);

  return (
    <figure className="flex flex-col gap-2 rounded-surface border border-line bg-surface p-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
        <span className="font-medium text-text">Last {points.length} tests</span>
        <span className="text-sub">
          avg <span className="font-mono text-text">{avg}</span> · best{" "}
          <span className="font-mono text-main">{Math.round(max)}</span> · latest{" "}
          <span className="font-mono text-text">{last}</span> wpm
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`WPM over your last ${points.length} tests, from ${Math.round(points[0])} to ${last}, averaging ${avg}.`}
        className="h-16 w-full"
      >
        <line x1={0} x2={W} y1={y(avg)} y2={y(avg)} className="stroke-line-strong" strokeWidth={1} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
        <path d={line} fill="none" className="chart-fade stroke-main" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </figure>
  );
}
