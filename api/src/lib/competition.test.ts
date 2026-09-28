import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { KEY_SPACE, coreWord, generateWords, type Keystroke, type ResultSubmission, type TestConfig } from "@keystride/engine";
import { competitionWordCount, competitionWords, matchesCompetition, newSlug } from "./competition";
import { verifySubmission } from "./verify";

const cfg = (over: Partial<TestConfig> = {}): TestConfig => ({
  mode: "time", amount: 30, punctuation: false, numbers: false, language: "english", ...over,
});

/** Human-ish typing of the first `n` words, perfectly accurate. */
function typeWords(config: TestConfig, words: string[], n: number): ResultSubmission {
  const keystrokes: Keystroke[] = [];
  let t = 0;
  let seed = 7;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return (t += 70 + (seed / 2 ** 32) * 160);
  };
  const typed = words.slice(0, n);
  typed.forEach((w, i) => {
    for (const ch of w) keystrokes.push({ t: next(), key: ch, correct: true });
    if (i < n - 1 || config.mode === "time") keystrokes.push({ t: next(), key: KEY_SPACE, correct: true });
  });
  const wordsMode = config.mode === "words";
  return {
    config,
    words: wordsMode ? words : words.slice(0, n + 1),
    typed: wordsMode ? typed : [...typed, ""],
    committed: n,
    keystrokes,
    durationMs: wordsMode ? t : config.amount * 1000,
  };
}

describe("competition words", () => {
  it("sizes time tests for very fast typists and words tests exactly", () => {
    assert.equal(competitionWordCount(cfg({ amount: 60 })), 340);
    assert.equal(competitionWordCount(cfg({ mode: "words", amount: 25 })), 25);
  });

  it("generates text the verifier accepts, for every option combination", () => {
    for (const punctuation of [false, true]) {
      for (const numbers of [false, true]) {
        const config = cfg({ mode: "words", amount: 50, punctuation, numbers });
        const words = competitionWords(config);
        const v = verifySubmission(typeWords(config, words, words.length));
        assert.ok(v.ok, v.ok ? "" : `${v.error} (punctuation=${punctuation}, numbers=${numbers})`);
      }
    }
  });

  it("never repeats a word across generator batches", () => {
    for (let run = 0; run < 300; run++) {
      const first = generateWords(5, { punctuation: run % 2 === 0, numbers: false });
      const next = generateWords(5, { punctuation: run % 2 === 0, numbers: false }, first[4]);
      assert.notEqual(coreWord(next[0]), coreWord(first[4]));
    }
  });
});

describe("matchesCompetition", () => {
  const config = cfg();
  const words = competitionWords(config);

  it("accepts a prefix of the competition text in time mode", () => {
    assert.equal(matchesCompetition(typeWords(config, words, 20), { config, words }), null);
  });

  it("rejects other settings or other words", () => {
    const sub = typeWords(config, words, 20);
    assert.ok(matchesCompetition({ ...sub, config: cfg({ amount: 60 }) }, { config, words }));
    const swapped = [...sub.words];
    swapped[3] = swapped[3] === "the" ? "of" : "the";
    assert.ok(matchesCompetition({ ...sub, words: swapped }, { config, words }));
  });

  it("requires the full text in words mode", () => {
    const wc = cfg({ mode: "words", amount: 10 });
    const ww = competitionWords(wc);
    assert.equal(matchesCompetition(typeWords(wc, ww, 10), { config: wc, words: ww }), null);
    assert.ok(matchesCompetition({ ...typeWords(wc, ww, 10), words: ww.slice(0, 9) }, { config: wc, words: ww }));
  });
});

describe("newSlug", () => {
  it("makes URL-safe 8-character codes", () => {
    const seen = new Set(Array.from({ length: 500 }, () => newSlug()));
    assert.equal(seen.size, 500);
    for (const s of seen) assert.match(s, /^[A-Za-z0-9]{8}$/);
  });
});
