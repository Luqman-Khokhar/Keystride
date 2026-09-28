"use client";

import Link from "next/link";
import { useState } from "react";
import { errorMessage, useGetCompetitionsInfiniteQuery, useGetMeQuery } from "@/store/api";
import type { CompetitionPage, CompetitionStatus } from "@/store/types";
import { buttonCls, EmptyState, ErrorState, linkCls, primaryButtonCls, Skeleton, Spinner } from "@/components/ui/states";
import { PlusIcon } from "@/components/ui/icons";
import { CompetitionCard } from "./CompetitionCard";
import { useServerClock } from "./useServerClock";

type Tab = CompetitionStatus | "mine";

const TAB_LABEL: Record<Tab, string> = { live: "Live", upcoming: "Upcoming", ended: "Ended", mine: "Mine" };

const EMPTY: Record<Tab, string> = {
  live: "No public competitions are running right now.",
  upcoming: "No public competitions are scheduled.",
  ended: "No competitions have finished yet.",
  mine: "You haven't created or joined a competition yet.",
};

const STEPS = [
  ["Create", "Pick the test, when it starts and how long it stays open."],
  ["Share", "Send the invite link. Everyone gets the same text."],
  ["Race", "Each player's best verified attempt counts on the live standings."],
] as const;

function HowItWorks() {
  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="How competitions work">
      {STEPS.map(([title, body], i) => (
        <li key={title} className="flex gap-3 rounded-surface border border-line p-4">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-main-soft font-mono text-sm text-main">
            {i + 1}
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-medium text-text">{title}</span>
            <span className="text-sm text-sub">{body}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

interface CompetitionListProps {
  /** Server-fetched first page of the "live" tab, shown until the client query lands. */
  initial?: CompetitionPage | null;
}

export function CompetitionList({ initial }: CompetitionListProps) {
  const { data: user } = useGetMeQuery();
  const [tab, setTab] = useState<Tab>("live");
  const { data, error, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useGetCompetitionsInfiniteQuery(tab);
  const nowMs = useServerClock(undefined);
  const serverItems = tab === "live" && !data ? initial?.items : undefined;
  const items = data?.pages.flatMap((p) => p.items) ?? serverItems ?? [];
  const tabs: Tab[] = user ? ["live", "upcoming", "ended", "mine"] : ["live", "upcoming", "ended"];

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Competitions</h1>
          <p className="text-sm text-sub">Race friends on the same text. Best verified score wins.</p>
        </div>
        <Link href={user ? "/competitions/new" : "/login?next=/competitions/new"} className={primaryButtonCls}>
          <PlusIcon className="size-4" />
          Create competition
        </Link>
      </div>

      <div role="group" aria-label="Filter competitions" className="flex w-fit max-w-full flex-wrap gap-1 rounded-surface bg-bg-alt p-1">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-control px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-main ${
              tab === t ? "bg-bg font-medium text-text shadow-sm" : "text-sub hover:text-text"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {!serverItems && (isLoading || (isFetching && !isFetchingNextPage && !items.length)) ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading competitions">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <Skeleton className="h-36 w-full" />
            </li>
          ))}
        </ul>
      ) : error && !items.length && !serverItems ? (
        <ErrorState message={errorMessage(error, "Couldn't load competitions")} onRetry={refetch} />
      ) : !items.length ? (
        <div className="flex flex-col gap-4">
          <EmptyState title={EMPTY[tab]}>
            <Link href={user ? "/competitions/new" : "/login?next=/competitions/new"} className={linkCls}>
              Create one
            </Link>{" "}
            and send the link to your friends.
          </EmptyState>
          <HowItWorks />
        </div>
      ) : (
        <>
          <ul className={`grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${data && isFetching && !isFetchingNextPage ? "opacity-60" : ""}`}>
            {items.map((c) => (
              <CompetitionCard key={c.slug} comp={c} nowMs={nowMs} />
            ))}
          </ul>
          {data && <div className="flex flex-col items-center gap-2 text-sm text-sub">
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
          </div>}
        </>
      )}
    </div>
  );
}
