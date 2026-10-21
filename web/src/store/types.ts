import type { TestConfig } from "@keystride/engine";
import type { RaceTrackStyle } from "@/lib/race";

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface SavedResult {
  id: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  chars: { correct: number; incorrect: number; extra: number; missed: number };
  mode: TestConfig["mode"];
  amount: number;
  punctuation: boolean;
  numbers: boolean;
  language: string;
  durationMs: number;
  isPb: boolean;
  flagged: boolean;
  competitionSlug: string | null;
  createdAt: string;
}

export interface HistoryPage {
  items: SavedResult[];
  nextCursor: string | null;
}

export interface PersonalBest {
  config: Pick<TestConfig, "mode" | "amount" | "punctuation" | "numbers" | "language">;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  createdAt: string;
}

export interface Summary {
  bests: PersonalBest[];
  tests: number;
  timeMs: number;
}

export interface Profile extends Summary {
  username: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  createdAt: string;
}

export interface Leaderboard {
  mode: "time";
  amount: 15 | 60;
  entries: LeaderboardEntry[];
  me: { rank: number; wpm: number } | null;
}

export interface SubmitResponse {
  id: string;
  wpm: number;
  accuracy: number;
  isPb: boolean;
  counted: boolean;
  flagReason: string | null;
}

export interface ApiErrorBody {
  error?: string;
  details?: { fields?: Record<string, string> };
}

export type CompetitionStatus = "upcoming" | "live" | "ended";
export type CompetitionVisibility = "public" | "unlisted";
/** "race": everyone starts together when the host says go; one attempt, ranked by finish time. */
export type CompetitionKind = "standard" | "race";

export interface CompetitionSummary {
  slug: string;
  kind: CompetitionKind;
  title: string;
  creator: string;
  config: TestConfig;
  visibility: CompetitionVisibility;
  startsAt: string;
  endsAt: string;
  playerCount: number;
  maxPlayers: number;
  maxAttempts: number | null;
  status: CompetitionStatus;
}

export interface CompetitionBest {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  at: string;
}

export interface CompetitionDetail extends CompetitionSummary {
  description: string;
  serverNow: string;
  /** null until the competition starts. */
  words: string[] | null;
  /** Races only. startedAt is null while the lobby is open. */
  race: {
    startedAt: string | null;
    /** Lobby opened by "Rematch" after this race. */
    rematchSlug: string | null;
    /** The race this lobby is a rematch of. */
    rematchOf: string | null;
    track: RaceTrackStyle;
  } | null;
  me: {
    joined: boolean;
    isCreator: boolean;
    attempts: number;
    best: CompetitionBest | null;
    /** Races only: verified finish, in ms after the start. */
    race: { finishMs: number } | null;
  } | null;
}

export interface CompetitionPage {
  items: CompetitionSummary[];
  nextCursor: string | null;
}

export interface StandingsEntry {
  rank: number | null;
  username: string;
  attempts: number;
  joinedAt: string;
  best: CompetitionBest | null;
  /** Races only: verified finish, in ms after the start. */
  finishMs: number | null;
}

export interface Standings {
  status: CompetitionStatus;
  serverNow: string;
  playerCount: number;
  entries: StandingsEntry[];
}

export interface CreateCompetitionInput {
  title: string;
  description: string;
  config: TestConfig;
  visibility: CompetitionVisibility;
  startsAt?: string;
  durationMinutes: number;
  maxPlayers: number;
  maxAttempts: number | null;
}

export interface CreateRaceInput {
  title: string;
  words: number;
  punctuation: boolean;
  numbers: boolean;
  maxPlayers: number;
  track: RaceTrackStyle;
}

export interface RaceStartResponse {
  startsAt: string;
  endsAt: string;
  serverNow: string;
}

export interface AttemptResponse {
  resultId: string;
  wpm: number;
  accuracy: number;
  counted: boolean;
  flagReason: string | null;
  improved: boolean;
  attempts: number;
  attemptsLeft: number | null;
  rank: number | null;
  best: number | null;
  race: { finishMs: number; place: number } | null;
}

/** Public share view of a verified result (/r/<id>). */
export interface PublicResult {
  id: string;
  username: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  chars: { correct: number; incorrect: number; extra: number; missed: number };
  mode: "time" | "words";
  amount: number;
  punctuation: boolean;
  numbers: boolean;
  language: string;
  durationMs: number;
  isPb: boolean;
  competitionSlug: string | null;
  createdAt: string;
  samples: { second: number; wpm: number; raw: number; errors: number }[];
}
