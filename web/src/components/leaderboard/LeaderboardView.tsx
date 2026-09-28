"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate } from "@/lib/format";
import { errorMessage, useGetLeaderboardQuery, useGetMeQuery } from "@/store/api";
import { EmptyState, ErrorState, linkCls, Skeleton } from "@/components/ui/states";

const AMOUNTS = [15, 60] as const;

export function LeaderboardView() {
  const [amount, setAmount] = useState<15 | 60>(15);
  const { data, error, isLoading, isFetching, refetch } = useGetLeaderboardQuery(amount);
  const { data: me } = useGetMeQuery();

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Leaderboard</h1>
          <p className="text-sm text-sub">English · no punctuation or numbers · verified results · best per person</p>
        </div>
        <div role="group" aria-label="Test length" className="flex gap-1 rounded-surface bg-bg-alt p-1">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={amount === a}
              onClick={() => setAmount(a)}
              className={`rounded-control px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-main ${
                amount === a ? "bg-bg font-medium text-text shadow-sm" : "text-sub hover:text-text"
              }`}
            >
              {a} seconds
            </button>
          ))}
        </div>
      </div>

      {data?.me && (
        <p className="rounded-surface bg-main-soft px-4 py-3 text-sm text-text">
          Your rank: <span className="text-main">#{data.me.rank}</span> with{" "}
          <span className="text-main">{Math.round(data.me.wpm)} wpm</span>
        </p>
      )}
      {data && !data.me && me && (
        <p className="text-sm text-sub">
          You&apos;re not ranked on time {amount} yet.{" "}
          <Link href="/" className={linkCls}>
            Take a test
          </Link>{" "}
          with time {amount} and no punctuation or numbers.
        </p>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading leaderboard">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error, "Couldn't load the leaderboard")} onRetry={refetch} />
      ) : !data?.entries.length ? (
        <EmptyState title={`No one is on the time ${amount} board yet.`}>
          <Link href="/" className={linkCls}>
            Take a test
          </Link>{" "}
          while signed in to claim first place.
        </EmptyState>
      ) : (
        <div className={`overflow-x-auto transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          <table className="w-full min-w-xl border-collapse text-left text-sm">
            <caption className="sr-only">Top {data.entries.length} for time {amount}</caption>
            <thead className="text-sub">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">#</th>
                <th scope="col" className="px-3 py-2 font-medium">Name</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">WPM</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Accuracy</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Raw</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Consistency</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((e) => {
                const isMe = me?.username === e.username;
                return (
                  <tr
                    key={e.username}
                    aria-current={isMe ? "true" : undefined}
                    className={`border-t border-line tabular-nums ${isMe ? "bg-main-soft" : ""}`}
                  >
                    <td className="px-3 py-2 text-sub">
                      {e.rank <= 3 ? <span className="text-main">{e.rank}</span> : e.rank}
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/u/${e.username}`} className="text-text hover:text-main hover:underline focus-visible:outline-2 focus-visible:outline-main">
                        {e.username}
                      </Link>
                      {isMe && <span className="ml-2 text-xs text-main">(you)</span>}
                    </td>
                    <td className="px-3 py-2 text-right text-main">{e.wpm.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{e.accuracy.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right">{e.rawWpm.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{e.consistency.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right text-sub">{formatDate(e.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.entries.length >= 50 && <p className="mt-3 text-center text-xs text-sub">Showing the top 50.</p>}
        </div>
      )}
    </div>
  );
}
