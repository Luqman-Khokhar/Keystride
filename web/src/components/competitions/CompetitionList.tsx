"use client";

import Link from "next/link";
import { useState } from "react";
import { errorMessage, useGetCompetitionsInfiniteQuery, useGetMeQuery } from "@/store/api";
import type { CompetitionStatus } from "@/store/types";
import { buttonCls, EmptyState, ErrorState, linkCls, primaryButtonCls, Skeleton, Spinner } from "@/components/ui/states";
import { CompetitionCard } from "./CompetitionCard";
import { useServerClock } from "./useServerClock";

type Tab = CompetitionStatus | "mine";

const EMPTY: Record<Tab, string> = {
  live: "No public competitions are running right now.",
  upcoming: "No public competitions are scheduled.",
  ended: "No competitions have finished yet.",
  mine: "You haven't created or joined a competition yet.",
};

export function CompetitionList() {
  const { data: user } = useGetMeQuery();
  const [tab, setTab] = useState<Tab>("live");
  const { data, error, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useGetCompetitionsInfiniteQuery(tab);
  const nowMs = useServerClock(undefined);
  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const tabs: Tab[] = user ? ["live", "upcoming", "ended", "mine"] : ["live", "upcoming", "ended"];

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl text-text">competitions</h1>
          <p className="text-sm text-sub">Race friends on the same text. Best verified score wins.</p>
        </div>
        <Link href={user ? "/competitions/new" : "/login?next=/competitions/new"} className={primaryButtonCls}>
          + create competition
        </Link>
      </div>

      <div role="group" aria-label="Filter competitions" className="flex w-fit max-w-full flex-wrap gap-1 rounded-lg bg-bg-alt p-1">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-main active:opacity-70 ${
              tab === t ? "bg-main text-bg" : "text-sub hover:text-text"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading || (isFetching && !isFetchingNextPage && !items.length) ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading competitions">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <Skeleton className="h-36 w-full" />
            </li>
          ))}
        </ul>
      ) : error && !items.length ? (
        <ErrorState message={errorMessage(error, "Couldn't load competitions")} onRetry={refetch} />
      ) : !items.length ? (
        <EmptyState title={EMPTY[tab]}>
          <Link href={user ? "/competitions/new" : "/login?next=/competitions/new"} className={linkCls}>
            Create one
          </Link>{" "}
          and send the link to your friends.
        </EmptyState>
      ) : (
        <>
          <ul className={`grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${isFetching && !isFetchingNextPage ? "opacity-60" : ""}`}>
            {items.map((c) => (
              <CompetitionCard key={c.slug} comp={c} nowMs={nowMs} />
            ))}
          </ul>
          <div className="flex flex-col items-center gap-2 text-sm text-sub">
            {hasNextPage ? (
              isFetchingNextPage ? (
                <Spinner label="Loading more…" />
              ) : (
                <button type="button" onClick={() => fetchNextPage()} className={buttonCls}>
                  Load more
                </button>
              )
            ) : (
              <p>
                Showing all {items.length} competition{items.length === 1 ? "" : "s"}.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
