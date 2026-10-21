/** Server-only channel: start/finish/end announcements (players may only listen). */
export const raceChannel = (slug: string) => `race:${slug}`;
/** Player channel: progress pings and presence. */
export const raceLiveChannel = (slug: string) => `race-live:${slug}`;

export const RACE_WORD_OPTIONS = [10, 25, 50] as const;
export const RACE_PLAYER_OPTIONS = [2, 3, 4] as const;

/** What each player shares in the lobby's presence set. */
export interface RacePresence {
  username: string;
}

export interface RaceStartEvent {
  startsAt: string;
  endsAt: string;
  serverNow: string;
  words: string[];
}

export interface RaceFinishEvent {
  username: string;
  place: number;
  wpm: number;
  accuracy: number;
  finishMs: number;
}

/** 12345 → "12.35s" */
export function formatRaceTime(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

/** What each player broadcasts ~10×/s while racing. */
export interface RaceProgressEvent {
  username: string;
  /** 0–1 share of the text typed correctly. */
  p: number;
  wpm: number;
}

/** Lasers have four colors; players keep theirs by join order, so everyone sees the same. */
export const RACE_LANES = 4;
