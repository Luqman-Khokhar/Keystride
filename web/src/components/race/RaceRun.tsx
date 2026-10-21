"use client";

import { useChannel } from "ably/react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { TypingSession } from "@/lib/engine/session";
import { sessionProgress } from "@/lib/race-progress";
import {
  RACE_LANES,
  raceChannel,
  raceLiveChannel,
  type RaceFinishEvent,
  type RaceProgressEvent,
} from "@/lib/race";
import type { CompetitionDetail, StandingsEntry } from "@/store/types";
import { LiveCounter } from "@/components/typing/LiveCounter";
import { TypingArea } from "@/components/typing/TypingArea";
import { useFocusMode } from "@/components/typing/useFocusMode";
import { RaceAttempt } from "./RaceAttempt";
import { RaceTrack, type Lane } from "./RaceTrack";

const PUBLISH_MS = 100;

interface Props {
  comp: CompetitionDetail;
  words: string[];
  me: string;
  online: Set<string>;
  players: StandingsEntry[] | undefined;
}

/** The race itself: everyone's lasers on top, this player's typing test below. */
export function RaceRun({ comp, words, me, online, players }: Props) {
  const [session] = useState(() => new TypingSession(comp.config, words, { fixedWords: true }));
  const phase = useSyncExternalStore(session.subscribe, session.getPhase, session.getPhase);
  const inputRef = useRef<HTMLInputElement>(null);
  useFocusMode(phase);

  // Own laser follows every keystroke, no network involved.
  const subscribeProgress = useCallback(
    (fn: () => void) => {
      const a = session.subscribe(fn);
      const b = session.subscribeCursor(fn);
      return () => {
        a();
        b();
      };
    },
    [session],
  );
  const myP = useSyncExternalStore(subscribeProgress, () => sessionProgress(session), () => 0);
  const [myWpm, setMyWpm] = useState(0);

  const [others, setOthers] = useState<Record<string, { p: number; wpm: number }>>({});
  const [finishes, setFinishes] = useState<Record<string, RaceFinishEvent>>({});

  const { publish } = useChannel(raceLiveChannel(comp.slug), "progress", (msg) => {
    const d = msg.data as RaceProgressEvent;
    if (!d?.username || d.username === me) return;
    setOthers((prev) => ({ ...prev, [d.username]: { p: Math.min(1, Math.max(0, d.p)), wpm: d.wpm } }));
  });
  useChannel(raceChannel(comp.slug), "finish", (msg) => {
    const d = msg.data as RaceFinishEvent;
    setFinishes((prev) => ({ ...prev, [d.username]: d }));
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Broadcast progress ~10×/s, only when it changed.
  useEffect(() => {
    let last = { p: -1, wpm: -1 };
    const id = window.setInterval(() => {
      const p = sessionProgress(session);
      const wpm =
        session.phase === "running"
          ? Math.round(session.liveStats(performance.now()).wpm)
          : Math.round(session.result?.wpm ?? 0);
      if (p === last.p && wpm === last.wpm) return;
      last = { p, wpm };
      setMyWpm(wpm);
      publish("progress", { username: me, p, wpm } satisfies RaceProgressEvent).catch(() => {
        // Dropped ping: the next one carries the same state.
      });
    }, PUBLISH_MS);
    return () => window.clearInterval(id);
  }, [session, publish, me]);

  const lanes = useMemo<Lane[]>(() => {
    // Join order keeps colors stable for everyone; finishers from standings cover reloads.
    const ordered = [...(players ?? [])].sort((a, b) => Date.parse(a.joinedAt) - Date.parse(b.joinedAt));
    const finishedOrder = ordered
      .filter((p) => p.finishMs !== null)
      .sort((a, b) => (a.finishMs ?? 0) - (b.finishMs ?? 0))
      .map((p) => p.username);
    return ordered.map((p, i) => {
      const isMe = p.username === me;
      const live = finishes[p.username];
      const stored = p.finishMs !== null ? { place: finishedOrder.indexOf(p.username) + 1, finishMs: p.finishMs } : null;
      const finish = live ? { place: live.place, finishMs: live.finishMs } : stored;
      const o = others[p.username];
      return {
        username: p.username,
        color: (i % RACE_LANES) + 1,
        p: isMe ? myP : finish ? 1 : (o?.p ?? 0),
        wpm: isMe ? myWpm : finish && live ? Math.round(live.wpm) : (o?.wpm ?? 0),
        isMe,
        online: isMe || online.has(p.username),
        finish,
      };
    });
  }, [players, me, myP, myWpm, others, finishes, online]);

  return (
    <div className="flex flex-col gap-5">
      <RaceTrack lanes={lanes} />
      {phase === "finished" && session.submission ? (
        <RaceAttempt slug={comp.slug} submission={session.submission} />
      ) : (
        <div className="flex w-full flex-col gap-2">
          <LiveCounter session={session} />
          <TypingArea session={session} inputRef={inputRef} />
        </div>
      )}
    </div>
  );
}
