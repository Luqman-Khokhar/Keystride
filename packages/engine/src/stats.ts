import type {
  CharStats,
  Keystroke,
  SecondSample,
  TestConfig,
  TestResult,
} from "./types";

export interface ResultInput {
  words: readonly string[];
  typed: readonly string[];
  /** Number of words the user committed (moved past). */
  committed: number;
  keystrokes: readonly Keystroke[];
  durationMs: number;
  config: TestConfig;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Standard: 5 characters = 1 word. */
export function wpmFrom(chars: number, ms: number): number {
  if (ms <= 0) return 0;
  return (chars / 5) * (60000 / ms);
}

/**
 * Monkeytype's "kogasa" mapping: turns a coefficient of variation
 * into a 0–100 score where 100 means perfectly steady.
 */
export function consistencyFrom(values: readonly number[]): number {
  if (values.length < 2) return values.length === 1 ? 100 : 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance =
    values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
  const cov = Math.sqrt(variance) / mean;
  return 100 * (1 - Math.tanh(cov + cov ** 3 / 3 + cov ** 5 / 5));
}

export function charStats(
  words: readonly string[],
  typed: readonly string[],
  committed: number,
): CharStats {
  const s: CharStats = { correct: 0, incorrect: 0, extra: 0, missed: 0 };
  const last = typed[committed] ? committed : committed - 1;

  for (let i = 0; i <= last; i++) {
    const target = words[i];
    const input = typed[i] ?? "";
    const isPartial = i >= committed;

    for (let j = 0; j < Math.max(target.length, input.length); j++) {
      if (j >= target.length) s.extra++;
      else if (j >= input.length) {
        if (!isPartial) s.missed++;
      } else if (input[j] === target[j]) s.correct++;
      else s.incorrect++;
    }
  }
  return s;
}

/**
 * Net chars = characters of fully correct words plus the spaces between them.
 * A trailing partially typed word counts if it is a correct prefix so far.
 */
function netChars(
  words: readonly string[],
  typed: readonly string[],
  committed: number,
): { net: number; raw: number } {
  let net = 0;
  let raw = 0;
  const hasPartial = !!typed[committed] && committed < words.length;
  const total = committed + (hasPartial ? 1 : 0);

  for (let i = 0; i < total; i++) {
    const input = typed[i] ?? "";
    const target = words[i];
    const space = i < total - 1 ? 1 : 0;
    raw += input.length + space;

    const ok = i < committed ? input === target : target.startsWith(input);
    if (ok) net += input.length + space;
  }
  return { net, raw };
}

export function perSecondSamples(
  keystrokes: readonly Keystroke[],
  durationMs: number,
): SecondSample[] {
  const seconds = Math.max(1, Math.ceil(durationMs / 1000 - 0.001));
  const typedPer = new Array<number>(seconds).fill(0);
  const correctPer = new Array<number>(seconds).fill(0);
  const errorsPer = new Array<number>(seconds).fill(0);

  for (const k of keystrokes) {
    if (k.correct === null) continue;
    const s = Math.min(seconds - 1, Math.max(0, Math.floor(k.t / 1000)));
    typedPer[s]++;
    if (k.correct) correctPer[s]++;
    else errorsPer[s]++;
  }

  const samples: SecondSample[] = [];
  let cumulative = 0;
  for (let s = 0; s < seconds; s++) {
    cumulative += correctPer[s];
    const end = Math.min((s + 1) * 1000, durationMs);
    const span = end - s * 1000;
    samples.push({
      second: s + 1,
      wpm: round2(wpmFrom(cumulative, end)),
      raw: round2(wpmFrom(typedPer[s], span > 0 ? span : 1000)),
      errors: errorsPer[s],
    });
  }
  return samples;
}

export function computeResult(input: ResultInput): TestResult {
  const { words, typed, committed, keystrokes, durationMs, config } = input;
  const { net, raw } = netChars(words, typed, committed);

  let correctKeys = 0;
  let totalKeys = 0;
  for (const k of keystrokes) {
    if (k.correct === null) continue;
    totalKeys++;
    if (k.correct) correctKeys++;
  }

  const samples = perSecondSamples(keystrokes, durationMs);
  // A short final second distorts consistency; drop it when it is under half a second.
  const tailMs = durationMs % 1000;
  const consistencySamples =
    samples.length > 1 && tailMs > 0 && tailMs < 500
      ? samples.slice(0, -1)
      : samples;

  return {
    wpm: round2(wpmFrom(net, durationMs)),
    rawWpm: round2(wpmFrom(raw, durationMs)),
    accuracy: totalKeys ? round2((correctKeys / totalKeys) * 100) : 0,
    consistency: round2(consistencyFrom(consistencySamples.map((s) => s.raw))),
    chars: charStats(words, typed, committed),
    durationMs: Math.round(durationMs),
    config,
    samples,
    keystrokes: [...keystrokes],
    finishedAt: Date.now(),
  };
}
