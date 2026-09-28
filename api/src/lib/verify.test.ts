import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { KEY_DELETE, KEY_PREV_WORD, KEY_SPACE, type Keystroke, type ResultSubmission, type TestConfig } from "@keystride/engine";
import { replay, verifySubmission } from "./verify";

const TIME15: TestConfig = { mode: "time", amount: 15, punctuation: false, numbers: false, language: "english" };

/** Seeded PRNG so timings are deterministic but human-like. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

interface Options {
  config?: TestConfig;
  jitter?: boolean;
  msPerKey?: number;
  finishWithSpace?: boolean;
}

/** Simulates a user typing `inputs` (one entry per word, may contain mistakes). */
function simulate(words: string[], inputs: string[], opts: Options = {}): ResultSubmission {
  const config = opts.config ?? TIME15;
  const rand = rng(42);
  const base = opts.msPerKey ?? 180;
  const keystrokes: Keystroke[] = [];
  let t = 0;
  const next = () => (t += opts.jitter === false ? base : base * (0.4 + rand() * 1.2));

  inputs.forEach((input, i) => {
    [...input].forEach((ch, j) => keystrokes.push({ t: next(), key: ch, correct: ch === words[i][j] }));
    const last = i === inputs.length - 1;
    if (!last || opts.finishWithSpace) keystrokes.push({ t: next(), key: KEY_SPACE, correct: input === words[i] });
  });

  const committed = opts.finishWithSpace ? inputs.length : inputs.length - 1;
  const wordsMode = config.mode === "words";
  const done = wordsMode && inputs[inputs.length - 1] === words[inputs.length - 1];
  return {
    config,
    words: wordsMode ? words : words.slice(0, inputs.length),
    typed: inputs,
    committed: wordsMode && done ? words.length : committed,
    keystrokes,
    durationMs: wordsMode ? t : config.amount * 1000,
  };
}

const WORDS = ["the", "world", "people", "house", "school", "number", "program", "system", "change", "public", "great", "little"];

describe("replay", () => {
  it("rebuilds words, deletions and returning to a previous word", () => {
    const k = (key: string): Keystroke => ({ t: 0, key, correct: null });
    const r = replay([k("t"), k("h"), k("x"), k(KEY_SPACE), k(KEY_PREV_WORD), k(KEY_DELETE), k("e"), k(KEY_SPACE), k("w")]);
    assert.deepEqual(r, { typed: ["the", "w"], index: 1 });
  });

  it("rejects a space on an empty word", () => {
    assert.equal(replay([{ t: 0, key: KEY_SPACE, correct: true }]), null);
  });
});

describe("verifySubmission", () => {
  it("accepts a normal human test and recomputes stats", () => {
    const v = verifySubmission(simulate(WORDS, WORDS.slice(0, 10)));
    assert.ok(v.ok);
    assert.equal(v.flagReason, null);
    assert.equal(v.result.accuracy, 100);
    assert.ok(v.result.wpm > 0);
  });

  it("ignores client correctness flags", () => {
    const sub = simulate(WORDS, ["tha", ...WORDS.slice(1, 10)]);
    for (const k of sub.keystrokes) if (k.correct === false) k.correct = true;
    const v = verifySubmission(sub);
    assert.ok(v.ok);
    assert.ok(v.result.accuracy < 100);
  });

  it("rejects typed text that doesn't match the keystroke log", () => {
    const sub = simulate(WORDS, WORDS.slice(0, 10));
    sub.typed[3] = "hacked";
    assert.equal(verifySubmission(sub).ok, false);
  });

  it("rejects words not in the word list", () => {
    const words = ["zzz", "qqq", "the"];
    assert.equal(verifySubmission(simulate(words, words)).ok, false);
  });

  it("rejects back-to-back repeated words", () => {
    const words = ["a", "a", "a", "a"];
    assert.equal(verifySubmission(simulate(words, words)).ok, false);
  });

  it("rejects a time test with the wrong duration", () => {
    const sub = simulate(WORDS, WORDS.slice(0, 10));
    sub.durationMs = 5000;
    assert.equal(verifySubmission(sub).ok, false);
  });

  it("flags metronomic bot timing", () => {
    const v = verifySubmission(simulate(WORDS, WORDS.slice(0, 10), { jitter: false }));
    assert.ok(v.ok);
    assert.equal(v.flagReason, "keystroke timing too uniform");
  });

  it("flags impossible speed", () => {
    const v = verifySubmission(simulate(WORDS, WORDS.slice(0, 12), { msPerKey: 12 }));
    assert.ok(v.ok);
    assert.ok(v.flagReason);
  });

  it("accepts a words test finished by typing the last word exactly", () => {
    const config: TestConfig = { ...TIME15, mode: "words", amount: 10 };
    const words = WORDS.slice(0, 10);
    const v = verifySubmission(simulate(words, words, { config }));
    assert.ok(v.ok, v.ok ? "" : v.error);
    assert.equal(v.flagReason, null);
    assert.equal(v.result.chars.correct, words.join("").length);
  });
});
