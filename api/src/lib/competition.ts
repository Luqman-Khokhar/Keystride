import { randomBytes } from "node:crypto";
import { generateWords, type ResultSubmission, type TestConfig } from "@keystride/engine";

const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alikes

/** 8-char URL code, ~46 bits of randomness. */
export function newSlug(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/**
 * Word count for a competition. Time tests need enough words for a very fast
 * typist (~300 wpm) to never run out; words tests use exactly `amount`.
 */
export function competitionWordCount(config: TestConfig): number {
  return config.mode === "words" ? config.amount : Math.ceil((config.amount / 60) * 300) + 40;
}

export function competitionWords(config: TestConfig): string[] {
  return generateWords(competitionWordCount(config), config, undefined, config.language);
}

const sameConfig = (a: TestConfig, b: TestConfig) =>
  a.mode === b.mode &&
  a.amount === b.amount &&
  a.punctuation === b.punctuation &&
  a.numbers === b.numbers &&
  a.language === b.language;

/** A competition attempt must use the competition's config and exactly its words. */
export function matchesCompetition(
  sub: ResultSubmission,
  comp: { config: TestConfig; words: string[] },
): string | null {
  if (!sameConfig(sub.config, comp.config)) return "test settings don't match the competition";
  if (sub.words.length > comp.words.length) return "more words than the competition text";
  if (comp.config.mode === "words" && sub.words.length !== comp.words.length) {
    return "incomplete competition text";
  }
  for (let i = 0; i < sub.words.length; i++) {
    if (sub.words[i] !== comp.words[i]) return "text doesn't match the competition";
  }
  return null;
}
