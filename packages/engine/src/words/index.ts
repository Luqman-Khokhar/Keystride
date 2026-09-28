import english from "./english.json";

export const WORD_LISTS = {
  english: english.words,
} as const;

export type Language = keyof typeof WORD_LISTS;
