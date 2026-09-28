"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/format";
import { errorMessage, useGetLeaderboardQuery, useGetMeQuery } from "@/store/api";
import type { Leaderboard, LeaderboardEntry } from "@/store/types";
import { EmptyState, ErrorState, linkCls, Skeleton } from "@/components/ui/states";

const AMOUNTS = [15, 60] as const;
type Amount = (typeof AMOUNTS)[number];

const PLACE = ["1st", "2nd", "3rd"];

interface LeaderboardViewProps {
  /** Server-fetched 15-second board, so the first paint has real rows. `me` is always null here. */
  initial?: Leaderboard | null;
}

function Podium({ entries, me, myRef }: { entries: LeaderboardEntry[]; me?: string; myRef: (el: HTMLElement | null) => void }) {
  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Top three">
      {entries.map((e, i) => {
        const isMe = me === e.username;
        return (
          <li
            key={e.username}
            ref={isMe ? myRef : undefined}
            aria-current={isMe ? "true" : undefined}
            className={`flex items-center gap-4 rounded-surface border p-4 sm:flex-col sm:items-start sm:gap-2 ${
              i === 0 ? "border-main/40 bg-main-soft" : "border-line bg-surface"
            }`}
          >
            <span className={`text-sm font-medium ${i === 0 ? "text-main" : "text-sub"}`}>{PLACE[i]}</span>
            <Link
              href={`/u/${e.username}`}
              className="min-w-0 flex-1 truncate font-medium text-text hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-main"
            >
              {e.username}
              {isMe && <span className="ml-1.5 text-xs text-main">(you)</span>}
            </Link>
            <span className="text-right sm:text-left" title={`${e.wpm.toFixed(2)} wpm`}>
              <span className="font-mono text-3xl tabular-nums text-text">{Math.round(e.wpm)}</span>
              <span className="ml-1 text-sm text-sub">wpm · {Math.round(e.accuracy)}%</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function LoadingBoard() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading leaderboard">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full sm:h-28" />
        ))}
      </div>
      <div className="flex flex-col">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-line px-3 py-3">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="ml-auto h-4 w-10" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardView({ initial }: LeaderboardViewProps) {
  const [amount, setAmount] = useState<Amount>(15);
  const { data: fetched, error, isFetching, refetch } = useGetLeaderboardQuery(amount);
  const { data: me } = useGetMeQuery();
  // Until the client query lands, show the server copy of the default board.
  const data = fetched ?? (amount === 15 ? initial ?? undefined : undefined);

  // Pin "your rank" to the bottom of the screen while your own row is out of view.
  const [myEl, setMyEl] = useState<HTMLElement | null>(null);
  const [myRowVisible, setMyRowVisible] = useState(false);
  useEffect(() => {
    if (!myEl) return;
    const io = new IntersectionObserver(([entry]) => setMyRowVisible(entry.isIntersecting));
    io.observe(myEl);
    return () => io.disconnect();
  }, [myEl]);

  const podium = data?.entries.slice(0, 3) ?? [];
  const rest = data?.entries.slice(3) ?? [];
  const showPin = !!data?.me && !(myEl && myRowVisible);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Leaderboard</h1>
          <p className="text-sm text-sub">
            English · no punctuation or numbers · verified results · best per person
          </p>
          {data && !data.me && me && (
            <p className="mt-1 text-sm text-sub">
              You&apos;re not ranked on the {amount} second board yet.{" "}
              <Link href={`/typing-test/${amount === 15 ? "15-seconds" : "1-minute"}`} className={linkCls}>
                Take a {amount} second test
              </Link>
            </p>
          )}
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

      {!data && !error ? (
        <LoadingBoard />
      ) : !data ? (
        <ErrorState message={errorMessage(error, "Couldn't load the leaderboard")} onRetry={refetch} />
      ) : !data.entries.length ? (
        <EmptyState title={`No one is on the ${amount} second board yet.`}>
          <Link href="/" className={linkCls}>
            Take a test
          </Link>{" "}
          while signed in to claim first place.
        </EmptyState>
      ) : (
        <div className={`flex flex-col gap-4 transition-opacity duration-200 ${fetched && isFetching ? "opacity-60" : ""}`}>
          <Podium entries={podium} me={me?.username} myRef={setMyEl} />

          {rest.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">
                  Ranks 4 to {data.entries.length} for the {amount} second test
                </caption>
                <thead className="text-sub">
                  <tr>
                    <th scope="col" className="w-12 px-3 py-2 font-medium">#</th>
                    <th scope="col" className="px-3 py-2 font-medium">Name</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">WPM</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Accuracy</th>
                    <th scope="col" className="hidden px-3 py-2 text-right font-medium sm:table-cell">Raw</th>
                    <th scope="col" className="hidden px-3 py-2 text-right font-medium md:table-cell">Consistency</th>
                    <th scope="col" className="hidden px-3 py-2 text-right font-medium sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((e) => {
                    const isMe = me?.username === e.username;
                    return (
                      <tr
                        key={e.username}
                        ref={isMe ? setMyEl : undefined}
                        aria-current={isMe ? "true" : undefined}
                        className={`border-t border-line tabular-nums transition-colors hover:bg-surface ${isMe ? "bg-main-soft" : ""}`}
                      >
                        <td className="px-3 py-2.5 text-sub">{e.rank}</td>
                        <td className="max-w-40 truncate px-3 py-2.5">
                          <Link href={`/u/${e.username}`} className="text-text hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-main">
                            {e.username}
                          </Link>
                          {isMe && <span className="ml-1.5 text-xs text-main">(you)</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-text" title={`${e.wpm.toFixed(2)} wpm`}>
                          {Math.round(e.wpm)}
                        </td>
                        <td className="px-3 py-2.5 text-right" title={`${e.accuracy.toFixed(1)}%`}>
                          {Math.round(e.accuracy)}%
                        </td>
                        <td className="hidden px-3 py-2.5 text-right text-sub sm:table-cell">{Math.round(e.rawWpm)}</td>
                        <td className="hidden px-3 py-2.5 text-right text-sub md:table-cell">{Math.round(e.consistency)}%</td>
                        <td className="hidden px-3 py-2.5 text-right text-sub sm:table-cell" suppressHydrationWarning>
                          {formatDate(e.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {data.entries.length >= 50 && <p className="text-center text-xs text-sub">Showing the top 50.</p>}
        </div>
      )}

      {showPin && data?.me && (
        <p
          role="status"
          className="sticky bottom-4 z-10 mx-auto flex items-center gap-3 rounded-full border border-line bg-bg px-4 py-2 text-sm text-sub shadow-lg"
        >
          Your rank
          <span className="font-mono text-base text-main">#{data.me.rank}</span>
          <span className="font-mono text-text">{Math.round(data.me.wpm)}</span> wpm
        </p>
      )}
    </div>
  );
}
