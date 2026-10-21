"use client";

import { useChannel } from "ably/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { raceChannel, type RaceRematchEvent, type RaceRematchJoinEvent } from "@/lib/race";
import { errorMessage, useJoinCompetitionMutation, useRematchRaceMutation } from "@/store/api";
import type { CompetitionDetail } from "@/store/types";
import { AlertIcon, CloseIcon, RestartIcon } from "@/components/ui/icons";
import { ghostButtonCls, primaryButtonCls } from "@/components/ui/states";
import { RaceResults } from "./RaceResults";

interface Rematch {
  slug: string;
  /** Who called it; unknown when the page loaded after the call. */
  by: string | null;
  players: string[];
  maxPlayers: number;
}

/** "a", "a and b", "a, b and c" */
const names = (list: string[]) =>
  list.length <= 1 ? (list[0] ?? "") : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;

/** Joins the rematch lobby, then goes there. */
function useJoinRematch() {
  const router = useRouter();
  const [join, state] = useJoinCompetitionMutation();
  const go = async (slug: string) => {
    const res = await join(slug);
    if (!("error" in res)) router.push(`/c/${slug}`);
  };
  return [go, state] as const;
}

function RematchToast({ rematch, me, onClose }: { rematch: Rematch; me: string; onClose: () => void }) {
  const [join, { isLoading, error }] = useJoinRematch();
  const others = rematch.players.filter((p) => p !== me);
  const full = rematch.players.length >= rematch.maxPlayers;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rise-in fixed inset-x-4 bottom-4 z-50 flex flex-col gap-3 rounded-surface border border-main/40 bg-bg-alt p-4 shadow-2xl shadow-black/40 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-text">
          {rematch.by ? `${rematch.by} wants a rematch!` : "A rematch lobby is open"}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss rematch invite"
          className="-m-1 rounded p-1 text-sub transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-main"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      {others.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <ul className="flex flex-wrap gap-1.5" aria-label="Already in the rematch">
            {others.map((p) => (
              <li key={p} className="flex items-center gap-1.5 rounded-full bg-main-soft px-2.5 py-0.5 text-xs text-main">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-main" />
                {p}
              </li>
            ))}
          </ul>
          <p className="text-sm text-sub">
            <span className="text-text">{names(others)}</span> {others.length === 1 ? "is" : "are"} in
            <span className="tabular-nums">
              {" "}
              ({rematch.players.length}/{rematch.maxPlayers})
            </span>
            {full ? ". The lobby is full." : ". Hurry up and join them!"}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-error">
          <AlertIcon className="size-4" />
          {errorMessage(error, "Couldn't join the rematch")}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={isLoading || full}
          onClick={() => join(rematch.slug)}
          className={`${primaryButtonCls} flex-1`}
        >
          {isLoading ? "Joining…" : "Join rematch"}
        </button>
        <button type="button" onClick={onClose} className={ghostButtonCls}>
          Not now
        </button>
      </div>
    </div>
  );
}

function RematchButton({ comp, rematch, me }: { comp: CompetitionDetail; rematch: Rematch | null; me: string }) {
  const router = useRouter();
  const [call, { isLoading: calling, error: callError }] = useRematchRaceMutation();
  const [join, { isLoading: joining, error: joinError }] = useJoinRematch();
  const error = callError ?? joinError;
  const inIt = !!rematch?.players.includes(me);

  const onClick = async () => {
    if (rematch && inIt) router.push(`/c/${rematch.slug}`);
    else if (rematch) await join(rematch.slug);
    else {
      const res = await call(comp.slug);
      if ("data" in res && res.data) router.push(`/c/${res.data.slug}`);
    }
  };

  const label = calling || joining
    ? "Opening…"
    : !rematch
      ? "Rematch"
      : inIt
        ? "Back to rematch lobby"
        : `Join rematch${rematch.players.length ? ` (${rematch.players.length}/${rematch.maxPlayers})` : ""}`;

  return (
    <div className="flex flex-col gap-1.5">
      <button type="button" disabled={calling || joining} onClick={onClick} className={primaryButtonCls}>
        <RestartIcon className="size-4" />
        {label}
      </button>
      {!rematch && <p className="text-xs text-sub">Same settings, new text. Everyone here gets an invite.</p>}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-error">
          <AlertIcon className="size-4" />
          {errorMessage(error, "Couldn't open the rematch")}
        </p>
      )}
    </div>
  );
}

/**
 * Results for a racer, still connected to the race: a Rematch button, and a popup when
 * someone else calls one, updating as players join it.
 */
export function RaceRematch({ comp, me }: { comp: CompetitionDetail; me: string }) {
  const [rematch, setRematch] = useState<Rematch | null>(() =>
    comp.race?.rematchSlug
      ? { slug: comp.race.rematchSlug, by: null, players: [], maxPlayers: comp.maxPlayers }
      : null,
  );
  const [dismissed, setDismissed] = useState(false);

  useChannel(raceChannel(comp.slug), (msg) => {
    if (msg.name === "rematch") {
      const e = msg.data as RaceRematchEvent;
      setRematch((r) => ({
        slug: e.slug,
        by: e.by,
        players: r?.slug === e.slug && r.players.length ? r.players : [e.by],
        maxPlayers: comp.maxPlayers,
      }));
      setDismissed(false);
    } else if (msg.name === "rematch-join") {
      const e = msg.data as RaceRematchJoinEvent;
      setRematch((r) => ({ slug: e.slug, by: r?.by ?? e.players[0] ?? null, players: e.players, maxPlayers: e.maxPlayers }));
      // Every new joiner is another nudge, unless it was this player.
      if (e.username !== me) setDismissed(false);
    }
  });

  const showToast = !!rematch && !dismissed && rematch.by !== me && !rematch.players.includes(me);

  return (
    <>
      <RaceResults slug={comp.slug} me={me} actions={<RematchButton comp={comp} rematch={rematch} me={me} />} />
      {showToast && <RematchToast rematch={rematch} me={me} onClose={() => setDismissed(true)} />}
    </>
  );
}
