"use client";

import type * as Ably from "ably";
import { useChannel, useConnectionStateListener, usePresence, usePresenceListener } from "ably/react";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { raceChannel, raceLiveChannel, type RacePresence, type RaceStartEvent } from "@/lib/race";
import { api } from "@/store/api";
import type { AppDispatch } from "@/store/store";

/**
 * Server announcements for one race. `start` patches the cached competition straight away
 * (no refetch inside the countdown); `finish` and `end` refresh standings and status.
 */
export function useRaceEvents(slug: string) {
  const dispatch = useDispatch<AppDispatch>();

  useChannel(raceChannel(slug), (msg) => {
    if (msg.name === "start") {
      const e = msg.data as RaceStartEvent;
      dispatch(
        api.util.updateQueryData("getCompetition", slug, (d) => {
          d.startsAt = e.startsAt;
          d.endsAt = e.endsAt;
          d.serverNow = e.serverNow;
          d.words = e.words;
          d.race = { startedAt: e.serverNow, rematchSlug: null, rematchOf: d.race?.rematchOf ?? null };
        }),
      );
    } else if (msg.name === "finish") {
      dispatch(api.util.invalidateTags([{ type: "Standings", id: slug }]));
    } else if (msg.name === "end") {
      dispatch(api.util.invalidateTags([{ type: "Standings", id: slug }, { type: "Competition", id: slug }]));
    }
  });
}

/** Enters this player into the race's presence set and returns who's online, by username. */
export function useRacePresence(slug: string, username: string): Set<string> {
  usePresence<RacePresence>(raceLiveChannel(slug), { username });
  const { presenceData } = usePresenceListener<RacePresence>(raceLiveChannel(slug));
  return useMemo(() => new Set(presenceData.map((p) => p.data?.username).filter(Boolean)), [presenceData]);
}

/** Ably connection state, for a "reconnecting" banner. */
export function useRaceConnection(): Ably.ConnectionState {
  const [state, setState] = useState<Ably.ConnectionState>("initialized");
  useConnectionStateListener((change) => setState(change.current));
  return state;
}
