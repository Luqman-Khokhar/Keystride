"use client";

import Link from "next/link";
import { formatRaceTime } from "@/lib/race";
import { errorMessage, useGetStandingsQuery } from "@/store/api";
import { buttonCls, ErrorState, primaryButtonCls, Skeleton } from "@/components/ui/states";
import { DeviceBadge } from "./DeviceBadge";

/** Final order: finishers by time, then everyone who didn't finish. */
export function RaceResults({ slug, me, actions }: { slug: string; me?: string; actions?: React.ReactNode }) {
  const { data, error, isLoading, refetch } = useGetStandingsQuery(slug);

  return (
    <section aria-labelledby="results-title" className="flex flex-col gap-4 rounded-surface border border-line bg-surface p-5 sm:p-6">
      <h2 id="results-title" className="text-lg font-semibold text-text">
        Results
      </h2>
      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading results">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error && !data ? (
        <ErrorState message={errorMessage(error, "Couldn't load the results")} onRetry={refetch} />
      ) : (
        <ol className="flex flex-col gap-2" aria-label="Finishing order">
          {data?.entries.map((e) => {
            const isMe = e.username === me;
            const finished = e.finishMs !== null;
            return (
              <li
                key={e.username}
                aria-current={isMe ? "true" : undefined}
                className={`grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-control border px-3 py-2.5 tabular-nums ${
                  isMe ? "border-main/40 bg-main-soft" : "border-line"
                }`}
              >
                <span className={`font-mono text-lg ${e.rank === 1 ? "text-main" : "text-sub"}`}>
                  {finished ? `#${e.rank}` : "–"}
                </span>
                <span className="flex min-w-0 flex-col items-start gap-1">
                  <span className="max-w-full truncate text-text">
                    {e.username}
                    {isMe && <span className="ml-1.5 text-xs text-main">(you)</span>}
                  </span>
                  <DeviceBadge device={e.device} />
                </span>
                {finished && e.best ? (
                  <span className="text-right text-sm">
                    <span className="text-text">{formatRaceTime(e.finishMs ?? 0)}</span>
                    <span className="block text-xs text-sub sm:inline">
                      <span className="hidden sm:inline"> · </span>
                      {Math.round(e.best.wpm)} wpm · {Math.round(e.best.accuracy)}%
                    </span>
                  </span>
                ) : (
                  <span className="text-right text-xs text-sub">Did not finish</span>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-start">
        {actions}
        <Link href="/competitions/race" className={actions ? buttonCls : primaryButtonCls}>
          Start a new race
        </Link>
      </div>
    </section>
  );
}
