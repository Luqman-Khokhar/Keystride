"use client";

import { formatRemaining } from "@/lib/competition";
import { errorMessage, useStartRaceMutation } from "@/store/api";
import type { CompetitionDetail, StandingsEntry } from "@/store/types";
import { AlertIcon } from "@/components/ui/icons";
import { primaryButtonCls, Skeleton } from "@/components/ui/states";
import { ShareButton } from "@/components/competitions/ShareButton";
import { DeviceBadge } from "./DeviceBadge";

interface Props {
  comp: CompetitionDetail;
  players: StandingsEntry[] | undefined;
  online: Set<string>;
  me: string;
  nowMs: number;
}

/** Who's in, who's online, and the host's start button. */
export function RaceLobby({ comp, players, online, me, nowMs }: Props) {
  const [start, { isLoading, error }] = useStartRaceMutation();
  const isHost = !!comp.me?.isCreator;
  const onlineCount = players?.filter((p) => online.has(p.username)).length ?? 0;
  const canStart = onlineCount >= 2;
  const emptySeats = Math.max(0, comp.maxPlayers - (players?.length ?? 0));

  return (
    <section aria-labelledby="lobby-title" className="flex flex-col gap-5 rounded-surface border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="lobby-title" className="text-lg font-semibold text-text">
          Lobby
          <span className="ml-2 text-sm font-normal text-sub tabular-nums">
            {players?.length ?? comp.playerCount}/{comp.maxPlayers} players
          </span>
        </h2>
        <span className="text-xs text-sub tabular-nums">
          Closes in {formatRemaining(Date.parse(comp.endsAt) - nowMs)}
        </span>
      </div>

      <p className="-mt-2 text-sm text-sub">
        {isHost
          ? "Share the invite link so friends can join. Start once at least one of them is online."
          : `You're in. Stay on this page; the race starts for everyone when ${comp.creator} presses start.`}
      </p>

      {!players ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading players">
          {Array.from({ length: comp.maxPlayers }, (_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Players">
          {players.map((p) => {
            const isOnline = online.has(p.username);
            const isHostRow = p.username === comp.creator;
            return (
              <li
                key={p.username}
                className={`flex items-center gap-3 rounded-control border px-3 py-2.5 text-sm ${
                  p.username === me ? "border-main/40 bg-main-soft" : "border-line"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`size-2 shrink-0 rounded-full ${isOnline ? "bg-main" : "bg-sub-alt"}`}
                />
                <span className="min-w-0 flex-1 truncate text-text">
                  {p.username}
                  {p.username === me && <span className="ml-1.5 text-xs text-main">(you)</span>}
                </span>
                {isHostRow && <span className="rounded bg-bg-alt px-1.5 py-0.5 text-xs text-sub">host</span>}
                <DeviceBadge device={p.device} />
                <span className={`text-xs ${isOnline ? "text-main" : "text-sub"}`}>{isOnline ? "Online" : "Away"}</span>
              </li>
            );
          })}
          {Array.from({ length: emptySeats }, (_, i) => (
            <li
              key={`seat-${i}`}
              className="flex items-center gap-3 rounded-control border border-dashed border-line px-3 py-2.5 text-sm text-sub"
            >
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full border border-line-strong" />
              Open seat
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        {isHost ? (
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              disabled={!canStart || isLoading}
              onClick={() => start(comp.slug)}
              className={primaryButtonCls}
              aria-describedby="start-hint"
            >
              {isLoading ? "Starting…" : "Start race"}
            </button>
            <p id="start-hint" className="text-xs text-sub">
              {canStart
                ? `Starts a 5-second countdown for ${onlineCount} online player${onlineCount === 1 ? "" : "s"}.`
                : "Waiting for at least one more player to come online."}
            </p>
            {error && (
              <p role="alert" className="flex items-center gap-1.5 text-sm text-error">
                <AlertIcon className="size-4" />
                {errorMessage(error, "Couldn't start the race")}
              </p>
            )}
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-sub" role="status">
            <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-main motion-reduce:animate-none" />
            Waiting for {comp.creator} to start the race
          </p>
        )}
        <ShareButton slug={comp.slug} title={comp.title} />
      </div>
    </section>
  );
}
