"use client";

import { useChannel } from "ably/react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { TypingSession } from "@/lib/engine/session";
import { sessionCursor, sessionProgress } from "@/lib/race-progress";
import {
  RACE_LANES,
  raceChannel,
  raceLiveChannel,
  type RaceFinishEvent,
  type RaceProgressEvent,
} from "@/lib/race";
import { useSettings } from "@/lib/settings/useSettings";
import type { CompetitionDetail, StandingsEntry } from "@/store/types";
import { TypingArea } from "@/components/typing/TypingArea";
import { useFocusMode } from "@/components/typing/useFocusMode";
import { RaceAttempt } from "./RaceAttempt";
import { RaceHud, type PlaceChange } from "./RaceHud";
import { RaceTrack, type Lane } from "./RaceTrack";
import { RivalCarets, type Rival } from "./RivalCarets";

const PUBLISH_MS = 100;

interface Props {
  comp: CompetitionDetail;
  words: string[];
  me: string;
  online: Set<string>;
  players: StandingsEntry[] | undefined;
}

interface Other {
  p: number;
  wpm: number;
  w: number;
  c: number;
}

/**
 * The race itself. While typing, everything sits where the eyes already are: thin lasers
 * and a place/gap row right above the text, and rivals' carets inside it. After finishing,
 * the full laser track takes over so the player can watch the others come in.
 */
export function RaceRun({ comp, words, me, online, players }: Props) {
  const [session] = useState(() => new TypingSession(comp.config, words, { fixedWords: true }));
  const phase = useSyncExternalStore(session.subscribe, session.getPhase, session.getPhase);
  const inputRef = useRef<HTMLInputElement>(null);
  const { rivalCarets } = useSettings();
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

  const [others, setOthers] = useState<Record<string, Other>>({});
  const [finishes, setFinishes] = useState<Record<string, RaceFinishEvent>>({});

  const { publish } = useChannel(raceLiveChannel(comp.slug), "progress", (msg) => {
    const d = msg.data as RaceProgressEvent;
    if (!d?.username || d.username === me) return;
    const w = Math.min(words.length - 1, Math.max(0, Math.trunc(Number(d.w) || 0)));
    const c = Math.min(words[w].length, Math.max(0, Math.trunc(Number(d.c) || 0)));
    setOthers((prev) => ({ ...prev, [d.username]: { p: Math.min(1, Math.max(0, d.p)), wpm: d.wpm, w, c } }));
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
    let last = "";
    const id = window.setInterval(() => {
      const p = sessionProgress(session);
      const { w, c } = sessionCursor(session);
      const wpm =
        session.phase === "running"
          ? Math.round(session.liveStats(performance.now()).wpm)
          : Math.round(session.result?.wpm ?? 0);
      const key = `${p}|${wpm}|${w}|${c}`;
      if (key === last) return;
      last = key;
      setMyWpm(wpm);
      publish("progress", { username: me, p, wpm, w, c } satisfies RaceProgressEvent).catch(() => {
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

  const meLane = lanes.find((l) => l.isMe);
  const rivalLanes = lanes.filter((l) => !l.isMe);
  // Ties share a place, so nobody is "2nd" before anyone has typed.
  const place = 1 + rivalLanes.filter((r) => r.finish || r.p > myP).length;

  // Overtakes, derived during render (no timers): a new place bumps the note's key.
  const [placeState, setPlaceState] = useState<{ place: number; change: PlaceChange | null }>({ place, change: null });
  if (place !== placeState.place) {
    const lost = place > placeState.place;
    const passer = lost ? rivalLanes.filter((r) => r.finish || r.p > myP).sort((a, b) => a.p - b.p)[0] : null;
    const counts = phase === "running" && myP > 0;
    setPlaceState({
      place,
      change: counts
        ? {
            n: (placeState.change?.n ?? 0) + 1,
            text: lost ? `${passer?.username ?? "Someone"} passed you` : `You moved up to ${place === 1 ? "1st" : `#${place}`}`,
            color: lost ? (passer?.color ?? 1) : (meLane?.color ?? 1),
          }
        : placeState.change,
    });
  }
  const change = placeState.change;

  const rivals: Rival[] = rivalLanes
    .filter((r) => !r.finish && others[r.username])
    .map((r) => ({ username: r.username, color: r.color, w: others[r.username].w, c: others[r.username].c }));

  if (phase === "finished" && session.submission) {
    return (
      <div className="flex flex-col gap-5">
        <RaceTrack lanes={lanes} />
        <RaceAttempt slug={comp.slug} submission={session.submission} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <RaceTrack lanes={lanes} compact />
      {meLane && <RaceHud me={meLane} rivals={rivalLanes} place={place} totalWords={words.length} change={change} />}
      <div className="relative -mx-3 px-3 py-2">
        {/* Keyed overlay, so the tint replays without remounting the typing area. */}
        {change && (
          <div
            key={change.n}
            aria-hidden="true"
            className="race-flash pointer-events-none absolute inset-0 rounded-surface"
            style={{ "--lane": `var(--lane-${change.color})` } as React.CSSProperties}
          />
        )}
        <TypingArea session={session} inputRef={inputRef}>
          {rivalCarets && <RivalCarets session={session} rivals={rivals} />}
        </TypingArea>
      </div>
    </div>
  );
}
