"use client";

import Link from "next/link";
import { errorMessage, useGetStandingsQuery } from "@/store/api";
import type { CompetitionStatus } from "@/store/types";
import { ErrorState, Skeleton } from "@/components/ui/states";

const POLL_MS: Record<CompetitionStatus, number> = { live: 3000, upcoming: 10000, ended: 0 };

export function Standings({ slug, status, me }: { slug: string; status: CompetitionStatus; me?: string }) {
  const { data, error, isLoading, refetch } = useGetStandingsQuery(slug, {
    pollingInterval: POLL_MS[status],
    skipPollingIfUnfocused: true,
  });

  return (
    <section aria-labelledby="players-title" className="flex flex-col gap-3 rounded-lg bg-bg-alt p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="players-title" className="text-lg text-text">
          {status === "upcoming" ? "players" : "standings"}
          {data && <span className="ml-2 text-sm text-sub">({data.playerCount})</span>}
        </h2>
        {status === "live" && (
          <span className="flex items-center gap-1.5 text-xs text-sub">
            <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-main motion-reduce:animate-none" />
            updating live
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading players">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : error && !data ? (
        <ErrorState message={errorMessage(error, "Couldn't load players")} onRetry={refetch} />
      ) : (
        <ol className="flex flex-col gap-1" aria-label={status === "upcoming" ? "Players who joined" : "Standings, best first"}>
          {data?.entries.map((e) => {
            const isMe = e.username === me;
            return (
              <li
                key={e.username}
                aria-current={isMe ? "true" : undefined}
                className={`grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded px-2 py-1.5 text-sm tabular-nums ${
                  isMe ? "bg-sub-alt" : ""
                }`}
              >
                <span className={e.rank && e.rank <= 3 ? "text-main" : "text-sub"}>{e.rank ?? "–"}</span>
                <span className="truncate">
                  <Link href={`/u/${e.username}`} className="text-text hover:text-main hover:underline focus-visible:outline-2 focus-visible:outline-main">
                    {e.username}
                  </Link>
                  {isMe && <span className="ml-1.5 text-xs text-main">(you)</span>}
                </span>
                {e.best ? (
                  <span className="text-right" title={`${e.best.accuracy}% accuracy · ${e.attempts} attempt${e.attempts === 1 ? "" : "s"}`}>
                    <span className="text-main">{Math.round(e.best.wpm)}</span>
                    <span className="text-xs text-sub"> wpm · {Math.round(e.best.accuracy)}%</span>
                  </span>
                ) : (
                  <span className="text-right text-xs text-sub">{status === "upcoming" ? "ready" : "no score yet"}</span>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {data && data.entries.length >= 100 && <p className="text-xs text-sub">Showing the top 100.</p>}
    </section>
  );
}
