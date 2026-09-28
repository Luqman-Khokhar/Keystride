import { KEY_DELETE, KEY_PREV_WORD, KEY_SPACE } from "@keystride/engine";
import { computeResult } from "./stats";
import { generateWords } from "./words";
import type {
  Keystroke,
  Phase,
  ResultSubmission,
  TestConfig,
  TestResult,
  WordStatus,
} from "./types";

type Listener = () => void;

/** Keystroke times and durations share this rounding so the last key is never past the end. */
const round2 = (n: number) => Math.round(n * 100) / 100;
type KeystrokeListener = (k: Keystroke) => void;

export interface LiveStats {
  wpm: number;
  accuracy: number;
}

const TIME_MODE_BATCH = 60;
const TIME_MODE_BUFFER = 30;

/**
 * Framework-agnostic typing session. Holds all hot-path state outside React
 * so each keystroke notifies only the one word that changed.
 */
export class TypingSession {
  readonly config: TestConfig;
  words: string[];
  readonly typed: string[] = [];
  wordIndex = 0;
  phase: Phase = "idle";
  startedAt: number | null = null;
  result: TestResult | null = null;
  /** Raw inputs for server-side verification, set when the test finishes. */
  submission: ResultSubmission | null = null;

  private keystrokes: Keystroke[] = [];
  private wordListeners = new Map<number, Set<Listener>>();
  private listeners = new Set<Listener>();
  private cursorListeners = new Set<Listener>();
  private keystrokeListeners = new Set<KeystrokeListener>();

  // Running tallies so live stats are O(1) per tick.
  private correctKeys = 0;
  private totalKeys = 0;
  /** Chars of correctly committed words plus their trailing spaces. */
  private committedNetChars = 0;

  /** Competitions use one shared word list: never append generated words to it. */
  private readonly fixedWords: boolean;

  constructor(config: TestConfig, words?: string[], opts: { fixedWords?: boolean } = {}) {
    this.config = config;
    this.fixedWords = !!opts.fixedWords;
    const count =
      config.mode === "words" ? config.amount : TIME_MODE_BATCH + TIME_MODE_BUFFER;
    this.words = words ? [...words] : generateWords(count, config);
  }

  // ---- subscriptions -------------------------------------------------------

  /** Structural changes: phase, word list growth. */
  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  subscribeWord(index: number, fn: Listener) {
    let set = this.wordListeners.get(index);
    if (!set) this.wordListeners.set(index, (set = new Set()));
    set.add(fn);
    return () => {
      set.delete(fn);
    };
  }

  /** Fires after every input change; used for caret/scroll positioning. */
  subscribeCursor = (fn: Listener) => {
    this.cursorListeners.add(fn);
    return () => {
      this.cursorListeners.delete(fn);
    };
  };

  subscribeKeystroke = (fn: KeystrokeListener) => {
    this.keystrokeListeners.add(fn);
    return () => {
      this.keystrokeListeners.delete(fn);
    };
  };

  getPhase = () => this.phase;
  getWords = () => this.words;
  getTyped = (i: number) => this.typed[i] ?? "";
  getStatus = (i: number): WordStatus =>
    i < this.wordIndex ? "done" : i === this.wordIndex ? "active" : "pending";

  private emit() {
    this.listeners.forEach((fn) => fn());
  }
  private emitWord(i: number) {
    this.wordListeners.get(i)?.forEach((fn) => fn());
  }
  private emitCursor() {
    this.cursorListeners.forEach((fn) => fn());
  }

  // ---- input ---------------------------------------------------------------

  private start(now: number) {
    this.startedAt = now;
    this.phase = "running";
    this.emit();
  }

  private log(key: string, correct: boolean | null, now: number) {
    const k: Keystroke = {
      t: round2(now - (this.startedAt ?? now)),
      key,
      correct,
    };
    this.keystrokes.push(k);
    if (correct !== null) {
      this.totalKeys++;
      if (correct) this.correctKeys++;
    }
    this.keystrokeListeners.forEach((fn) => fn(k));
  }

  /** Same net-WPM definition as the final result, computed incrementally. */
  liveStats(now: number): LiveStats {
    const ms = this.elapsed(now);
    const input = this.typed[this.wordIndex] ?? "";
    const target = this.words[this.wordIndex] ?? "";
    const partial = input && target.startsWith(input) ? input.length : 0;
    const net = this.committedNetChars + partial;
    return {
      wpm: ms > 0 ? (net / 5) * (60000 / ms) : 0,
      accuracy: this.totalKeys ? (this.correctKeys / this.totalKeys) * 100 : 100,
    };
  }

  /** Time mode: input arriving after the deadline ends the test instead of counting. */
  private timeUp(now: number) {
    if (this.config.mode !== "time" || this.phase !== "running") return false;
    if (this.elapsed(now) < this.config.amount * 1000) return false;
    this.finish(now);
    return true;
  }

  /** Replace the current word's input with `value` (no spaces). */
  setInput(value: string, now: number) {
    if (this.phase === "finished" || this.timeUp(now)) return;
    const i = this.wordIndex;
    const prev = this.typed[i] ?? "";
    if (value === prev) return;
    if (this.phase === "idle") {
      if (!value) return;
      this.start(now);
    }

    const target = this.words[i];
    let common = 0;
    while (common < prev.length && common < value.length && prev[common] === value[common]) {
      common++;
    }
    for (let j = common; j < prev.length; j++) this.log(KEY_DELETE, null, now);
    for (let j = common; j < value.length; j++) {
      this.log(value[j], value[j] === target[j], now);
    }

    this.typed[i] = value;
    this.emitWord(i);

    // Words mode: finishing the last word exactly ends the test without a space.
    if (
      this.config.mode === "words" &&
      i === this.words.length - 1 &&
      value === target
    ) {
      this.wordIndex++;
      this.emitWord(i);
      this.finish(now);
      return;
    }
    this.emitCursor();
  }

  /** Space pressed: move to the next word. Returns false when ignored. */
  commitWord(now: number): boolean {
    if (this.phase !== "running" || this.timeUp(now)) return false;
    const i = this.wordIndex;
    const input = this.typed[i] ?? "";
    if (!input) return false;

    const correct = input === this.words[i];
    this.log(KEY_SPACE, correct, now);
    if (correct) this.committedNetChars += input.length + 1;
    this.wordIndex++;
    this.emitWord(i);

    if (this.config.mode === "words" && this.wordIndex >= this.words.length) {
      this.finish(now);
      return true;
    }
    this.emitWord(this.wordIndex);
    this.ensureWords();
    this.emitCursor();
    return true;
  }

  /**
   * Backspace on an empty word: return to the previous word only if it
   * contains a mistake. Returns that word's input, or null if not allowed.
   */
  backToPrevious(): string | null {
    if (this.phase !== "running" || this.wordIndex === 0) return null;
    if (this.timeUp(performance.now())) return null;
    if (this.typed[this.wordIndex]) return null;
    const prev = this.wordIndex - 1;
    if (this.typed[prev] === this.words[prev]) return null;

    this.log(KEY_PREV_WORD, null, performance.now());
    this.wordIndex = prev;
    this.emitWord(prev + 1);
    this.emitWord(prev);
    this.emitCursor();
    return this.typed[prev] ?? "";
  }

  private ensureWords() {
    if (this.config.mode !== "time" || this.fixedWords) return;
    if (this.words.length - this.wordIndex > TIME_MODE_BUFFER) return;
    const more = generateWords(
      TIME_MODE_BATCH,
      this.config,
      this.words[this.words.length - 1],
    );
    this.words = [...this.words, ...more];
    this.emit();
  }

  // ---- lifecycle -----------------------------------------------------------

  elapsed(now: number) {
    return this.startedAt === null ? 0 : now - this.startedAt;
  }

  finish(now: number) {
    if (this.phase === "finished" || this.startedAt === null) return;
    let durationMs = round2(now - this.startedAt);
    if (this.config.mode === "time") {
      durationMs = Math.min(durationMs, this.config.amount * 1000);
    }
    this.phase = "finished";
    const keystrokes = this.keystrokes.filter((k) => k.t <= durationMs);
    const touched = Math.min(this.words.length, this.wordIndex + 1);
    this.submission = {
      config: this.config,
      words: this.words.slice(0, touched),
      typed: this.typed.slice(0, touched).map((t) => t ?? ""),
      committed: this.wordIndex,
      keystrokes,
      durationMs,
    };
    this.result = computeResult({
      words: this.words,
      typed: this.typed,
      committed: this.wordIndex,
      keystrokes,
      durationMs,
      config: this.config,
    });
    this.emit();
  }
}
