export type TestMode = "time" | "words";

export const TIME_OPTIONS = [15, 30, 60, 120] as const;
export const WORD_OPTIONS = [10, 25, 50, 100] as const;

export interface TestConfig {
  mode: TestMode;
  /** Seconds in time mode, word count in words mode. */
  amount: number;
  punctuation: boolean;
  numbers: boolean;
  language: "english";
}

export const DEFAULT_CONFIG: TestConfig = {
  mode: "time",
  amount: 30,
  punctuation: false,
  numbers: false,
  language: "english",
};

export type Phase = "idle" | "running" | "finished";

export type WordStatus = "pending" | "active" | "done";

/** Special keystroke keys in the log (everything else is a typed character). */
export const KEY_SPACE = " ";
export const KEY_DELETE = "\b";
/** Backspace on an empty word that returned to the previous word. */
export const KEY_PREV_WORD = "\u2190";

export interface Keystroke {
  /** ms since test start (performance.now based). */
  t: number;
  /** Character typed, " " for word commit, "\b" for deletion. */
  key: string;
  /** null for deletions. */
  correct: boolean | null;
}

export interface SecondSample {
  second: number;
  wpm: number;
  raw: number;
  errors: number;
}

export interface CharStats {
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
}

export interface TestResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  chars: CharStats;
  durationMs: number;
  config: TestConfig;
  samples: SecondSample[];
  /** Kept for future server-side validation. */
  keystrokes: Keystroke[];
  finishedAt: number;
}

/** What the client sends to the server; the server recomputes everything from it. */
export interface ResultSubmission {
  config: TestConfig;
  /** Target words up to and including the last word the user touched. */
  words: string[];
  typed: string[];
  committed: number;
  keystrokes: Keystroke[];
  durationMs: number;
}
