import type { TestConfig } from "@keystride/engine";

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
