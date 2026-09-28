import { WORD_LISTS } from "@keystride/engine";

export interface WordOptions {
  punctuation: boolean;
  numbers: boolean;
}

const LISTS = WORD_LISTS;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(): string {
  const digits = 1 + Math.floor(Math.random() * 4);
  let out = String(1 + Math.floor(Math.random() * 9));
  for (let i = 1; i < digits; i++) out += Math.floor(Math.random() * 10);
  return out;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

const SENTENCE_END = /[.?!]$/;

/** Adds punctuation roughly following sentence structure. */
function punctuate(word: string, prev: string | undefined): string {
  let w = prev === undefined || SENTENCE_END.test(prev) ? capitalize(word) : word;
  const r = Math.random();
  if (r < 0.08) w += ".";
  else if (r < 0.14) w += ",";
  else if (r < 0.16) w += "?";
  else if (r < 0.18) w += "!";
  else if (r < 0.2) w += ";";
  else if (r < 0.22) w += ":";
  else if (r < 0.24) w = `"${w}"`;
  else if (r < 0.26) w = `(${w})`;
  else if (r < 0.27) w = `${w}'s`;
  return w;
}

/**
 * Generates `count` words. Pass the previous trailing word to continue
 * seamlessly (avoids repeats and keeps capitalization after sentence ends).
 */
export function generateWords(
  count: number,
  opts: WordOptions,
  prev?: string,
  language: keyof typeof LISTS = "english",
): string[] {
  const list = LISTS[language];
  const out: string[] = [];
  let last = prev;
  let lastBase: string | undefined;

  for (let i = 0; i < count; i++) {
    let base = pick(list);
    // Avoid the same word twice in a row.
    while (base === lastBase && list.length > 1) base = pick(list);
    lastBase = base;

    let word = opts.numbers && Math.random() < 0.1 ? randomNumber() : base;
    if (opts.punctuation) word = punctuate(word, last);
    out.push(word);
    last = word;
  }
  return out;
}
