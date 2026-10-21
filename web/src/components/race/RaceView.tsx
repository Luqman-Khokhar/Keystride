"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect } from "react";
import { testLabel } from "@/lib/format";
import { RACE_REMATCH_WINDOW_MS } from "@/lib/race";
import { useGetMeQuery, useGetStandingsQuery } from "@/store/api";
import type { CompetitionDetail, CompetitionStatus } from "@/store/types";
import { AlertIcon } from "@/components/ui/icons";
import { primaryButtonCls, Skeleton, Spinner } from "@/components/ui/states";
import { JoinButton } from "@/components/competitions/JoinButton";
import { useServerClock } from "@/components/competitions/useServerClock";
import { RaceCountdown } from "./RaceCountdown";
import { RaceLobby } from "./RaceLobby";
import { RaceRematch } from "./RaceRematch";
import { RaceResults } from "./RaceResults";
import { RaceRun } from "./RaceRun";
import { useRaceConnection, useRaceEvents, useRacePresence } from "./useRaceChannel";

// Ably is browser-only: connect once someone is actually in the race.
const RaceRealtime = dynamic(() => import("./RaceRealtime"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
});

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-surface border border-line px-6 py-10 text-center">
      {children}
    </div>
  );
}

function RaceHeader({ comp }: { comp: CompetitionDetail }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium tracking-wide text-main uppercase">Live race</p>
      <h1 className="text-2xl font-semibold tracking-tight break-words text-text">{comp.title}</h1>
      <p className="text-sm text-sub">
        {testLabel(comp.config)} · hosted by{" "}
        <Link href={`/u/${comp.creator}`} className="text-text hover:text-main hover:underline focus-visible:outline-2 focus-visible:outline-main">
          {comp.creator}
        </Link>{" "}
        · one attempt, first to finish wins
      </p>
    </div>
  );
}

function ConnectionBanner() {
  const state = useRaceConnection();
  if (state === "failed") {
    return (
      <p role="alert" className="flex items-center gap-2 rounded-control border border-error/40 px-3 py-2 text-sm text-error">
        <AlertIcon className="size-4" />
        Couldn&apos;t connect to the live race.{" "}
        <button type="button" onClick={() => window.location.reload()} className="underline underline-offset-4">
          Reload
        </button>
      </p>
    );
  }
  if (state === "disconnected" || state === "suspended") {
    return (
      <p role="status" className="flex items-center gap-2 rounded-control border border-line px-3 py-2 text-sm text-sub">
        <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-error motion-reduce:animate-none" />
        Reconnecting…
      </p>
    );
  }
  return null;
}

/** Inside the Ably connection: lobby → countdown → race. */
function RaceRoom({ comp, me }: { comp: CompetitionDetail; me: string }) {
  // Finer ticks than the page clock, so the countdown lands on zero.
  const nowMs = useServerClock(comp.serverNow, 100);
  useRaceEvents(comp.slug);
  const online = useRacePresence(comp.slug, me);
  const started = !!comp.race?.startedAt;
  const { data: standings, refetch } = useGetStandingsQuery(comp.slug, {
    pollingInterval: started ? 0 : 15_000,
    skipPollingIfUnfocused: true,
  });

  // Someone came online who isn't on the list yet: they just joined.
  const players = standings?.entries;
  useEffect(() => {
    if (players && [...online].some((u) => !players.some((p) => p.username === u))) refetch();
  }, [online, players, refetch]);

  let body: React.ReactNode;
  if (!started) {
    body = <RaceLobby comp={comp} players={players} online={online} me={me} nowMs={nowMs} />;
  } else if (nowMs < Date.parse(comp.startsAt)) {
    body = <RaceCountdown msLeft={Date.parse(comp.startsAt) - nowMs} />;
  } else if (!comp.words) {
    body = <Spinner label="Loading the text…" />;
  } else {
    body = <RaceRun comp={comp} words={comp.words} me={me} online={online} players={players} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <ConnectionBanner />
      {body}
    </div>
  );
}

interface Props {
  comp: CompetitionDetail;
  status: CompetitionStatus;
}

export function RaceView({ comp, status }: Props) {
  const { data: user, isLoading } = useGetMeQuery();
  const started = !!comp.race?.startedAt;
  const joined = !!comp.me?.joined;
  const next = `/login?next=${encodeURIComponent(`/c/${comp.slug}`)}`;

  let body: React.ReactNode;
  if (status === "ended") {
    // Racers stay connected for a while after the end, to call or answer a rematch.
    const rematchOpen = Date.parse(comp.serverNow) - Date.parse(comp.endsAt) < RACE_REMATCH_WINDOW_MS;
    if (!started) {
      body = (
        <Panel>
          <p className="text-2xl font-semibold tracking-tight text-text">This lobby has closed</p>
          <p className="text-sub">The host didn&apos;t start the race within an hour.</p>
          <Link href="/competitions/race" className={primaryButtonCls}>
            Start a new race
          </Link>
        </Panel>
      );
    } else if (user && joined && rematchOpen) {
      body = (
        <RaceRealtime key={comp.slug} slug={comp.slug}>
          <RaceRematch comp={comp} me={user.username} />
        </RaceRealtime>
      );
    } else {
      body = <RaceResults slug={comp.slug} me={user?.username} />;
    }
  } else if (isLoading) {
    body = <Skeleton className="h-64 w-full" />;
  } else if (!user) {
    body = (
      <Panel>
        <p className="text-sub">Sign in to join this race.</p>
        <Link href={next} className={primaryButtonCls}>
          Sign in to join
        </Link>
      </Panel>
    );
  } else if (!joined) {
    body = (
      <Panel>
        {started ? (
          <p className="text-sub">This race has already started. Ask the host for a rematch.</p>
        ) : comp.playerCount >= comp.maxPlayers ? (
          <p className="text-sub">This race is full.</p>
        ) : (
          <>
            <p className="text-sub">
              {comp.creator} invited you to race. Everyone types the same text at the same time.
            </p>
            <JoinButton slug={comp.slug} label="Join race" />
          </>
        )}
      </Panel>
    );
  } else {
    body = (
      <RaceRealtime key={comp.slug} slug={comp.slug}>
        <RaceRoom comp={comp} me={user.username} />
      </RaceRealtime>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <RaceHeader comp={comp} />
      {body}
    </div>
  );
}
