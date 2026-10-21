/** Server-only channel: start/finish/end announcements (players may only listen). */
export const raceChannel = (slug: string) => `race:${slug}`;
/** Player channel: progress pings and presence. */
export const raceLiveChannel = (slug: string) => `race-live:${slug}`;

export const RACE_WORD_OPTIONS = [10, 25, 50] as const;
export const RACE_PLAYER_OPTIONS = [2, 3, 4] as const;

/** How progress is drawn in the race: glowing lasers or pixel runners. */
export type RaceTrackStyle = "laser" | "runners";
export const RACE_TRACK_OPTIONS: readonly { value: RaceTrackStyle; label: string }[] = [
  { value: "laser", label: "Lasers" },
  { value: "runners", label: "Runners" },
];

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

export interface RaceRematchEvent {
  slug: string;
  by: string;
}

export interface RaceRematchJoinEvent {
  slug: string;
  username: string;
  /** Everyone in the rematch lobby so far, in join order. */
  players: string[];
  maxPlayers: number;
}

/** Finished races keep their players connected this long, for rematches (matches the API). */
export const RACE_REMATCH_WINDOW_MS = 30 * 60 * 1000;

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
  /** Word index and correct letters into it: where their caret sits in the text. */
  w: number;
  c: number;
}

/** Lasers have four colors; players keep theirs by join order, so everyone sees the same. */
export const RACE_LANES = 4;
