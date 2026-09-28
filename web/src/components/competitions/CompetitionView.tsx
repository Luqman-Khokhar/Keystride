"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatRemaining, statusAt } from "@/lib/competition";
import {
  errorMessage,
  errorStatus,
  useGetCompetitionQuery,
  useGetMeQuery,
  useJoinCompetitionMutation,
} from "@/store/api";
import type { CompetitionDetail, CompetitionStatus } from "@/store/types";
import { ErrorState, linkCls, primaryButtonCls, Skeleton, Spinner } from "@/components/ui/states";
import { AlertIcon } from "@/components/ui/icons";
import { CompetitionDetails } from "./CompetitionDetails";
import { Standings } from "./Standings";
import { useServerClock } from "./useServerClock";

// The typing engine is client-only; load it when someone can actually play.
const CompetitionPlay = dynamic(() => import("./CompetitionPlay"), {
  ssr: false,
  loading: () => <Skeleton className="h-40 w-full" />,
});

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-surface border border-line px-6 py-10 text-center">
      {children}
    </div>
  );
}

function JoinButton({ slug }: { slug: string }) {
  const [join, { isLoading, error }] = useJoinCompetitionMutation();
  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" disabled={isLoading} onClick={() => join(slug)} className={primaryButtonCls}>
        {isLoading ? "Joining…" : "Join competition"}
      </button>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-error">
          <AlertIcon className="size-4" />
          {errorMessage(error, "Couldn't join")}
        </p>
      )}
    </div>
  );
}

function MainArea({ comp, status, nowMs }: { comp: CompetitionDetail; status: CompetitionStatus; nowMs: number }) {
  const { data: user, isLoading: userLoading } = useGetMeQuery();
  const used = comp.me?.attempts ?? 0;
  const canRetry = comp.maxAttempts === null || used < comp.maxAttempts;
  // Only show "no attempts left" if they arrived that way; after a final attempt the
  // play area stays mounted so its result screen isn't yanked away by the refetch.
  const [exhaustedOnArrival] = useState(() => !canRetry);
  const joined = !!comp.me?.joined;
  const full = comp.playerCount >= comp.maxPlayers;
  const next = `/login?next=${encodeURIComponent(`/c/${comp.slug}`)}`;

  if (status === "ended") {
    return (
      <Panel>
        <p className="text-2xl font-semibold tracking-tight text-text">This competition has ended</p>
        <p className="text-sub">Final standings are on the right.</p>
        <Link href="/competitions/new" className={primaryButtonCls}>
          Create a new competition
        </Link>
      </Panel>
    );
  }

  if (userLoading) return <Skeleton className="h-64 w-full" />;

  const cta = !user ? (
    <Link href={next} className={primaryButtonCls}>
      Sign in to join
    </Link>
  ) : !joined && full ? (
    <p className="text-sub">This competition is full.</p>
  ) : !joined ? (
    <JoinButton slug={comp.slug} />
  ) : null;

  if (status === "upcoming") {
    return (
      <Panel>
        <p className="text-sub">Starts in</p>
        <p className="font-mono text-5xl tabular-nums text-main">{formatRemaining(Date.parse(comp.startsAt) - nowMs)}</p>
        <p className="max-w-md text-sm text-sub">
          The text is revealed when the competition starts, so everyone sees it at the same time.
          {joined && " You're in — come back when the timer hits zero."}
        </p>
        {cta}
      </Panel>
    );
  }

  // Live.
  if (cta) {
    return (
      <Panel>
        <p className="text-2xl font-semibold tracking-tight text-text">Competition is live</p>
        <p className="max-w-md text-sm text-sub">
          Everyone types the same {comp.config.mode === "time" ? `${comp.config.amount}-second` : `${comp.config.amount}-word`} test.
          {comp.maxAttempts ? ` You get ${comp.maxAttempts} attempt${comp.maxAttempts === 1 ? "" : "s"}` : " Unlimited attempts"} —
          your best score counts.
        </p>
        {cta}
      </Panel>
    );
  }

  if (exhaustedOnArrival) return <OutOfAttempts comp={comp} />;
  if (!comp.words) return <Spinner label="Loading the text…" />;

  return (
    <div className="flex flex-col gap-3">
      {comp.maxAttempts !== null && (
        <p className="text-center text-sm text-sub">
          Attempt {Math.min(used + 1, comp.maxAttempts)} of {comp.maxAttempts}
        </p>
      )}
      <CompetitionPlay slug={comp.slug} config={comp.config} words={comp.words} canRetry={canRetry} />
    </div>
  );
}

/** Player has used every attempt: show their standing instead of the text. */
function OutOfAttempts({ comp }: { comp: CompetitionDetail }) {
  return (
    <Panel>
      <p className="text-xl font-semibold text-text">You&apos;ve used all {comp.maxAttempts} attempts</p>
      {comp.me?.best ? (
        <p className="text-sub">
          Your best: <span className="text-main">{Math.round(comp.me.best.wpm)} wpm</span> at{" "}
          {Math.round(comp.me.best.accuracy)}% accuracy.
        </p>
      ) : (
        <p className="text-sub">None of your attempts were counted.</p>
      )}
    </Panel>
  );
}

export function CompetitionView({ slug }: { slug: string }) {
  const { data: comp, error, isLoading, refetch } = useGetCompetitionQuery(slug);
  const { data: user } = useGetMeQuery();
  const nowMs = useServerClock(comp?.serverNow);
  const status = comp ? statusAt(comp.startsAt, comp.endsAt, nowMs) : null;

  // When the clock crosses the start or end, fetch again (the text is revealed at the start).
  useEffect(() => {
    if (comp && status && status !== comp.status) refetch();
  }, [comp, status, refetch]);

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" aria-busy="true" aria-label="Loading competition">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (errorStatus(error) === 404 || errorStatus(error) === 400) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Competition not found</h1>
        <p className="text-sub">
          The link may be wrong, or the creator deleted it.{" "}
          <Link href="/competitions" className={linkCls}>
            Browse competitions
          </Link>
          .
        </p>
      </div>
    );
  }
  if (error || !comp || !status) {
    return <ErrorState message={errorMessage(error, "Couldn't load this competition")} onRetry={refetch} />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="lg:col-start-2 lg:row-start-1">
        <CompetitionDetails comp={comp} status={status} nowMs={nowMs} />
      </div>
      <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <MainArea comp={comp} status={status} nowMs={nowMs} />
      </div>
      <div className="lg:col-start-2 lg:row-start-2">
        <Standings slug={comp.slug} status={status} me={user?.username} />
      </div>
    </div>
  );
}
