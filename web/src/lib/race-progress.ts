import type { TypingSession } from "@/lib/engine/session";

/**
 * Share of the race text typed so far: whole words done plus the correct prefix of the
 * current word. A wrong letter holds the laser still until it's fixed.
 */
export function sessionProgress(s: TypingSession): number {
  const n = s.words.length;
  if (s.phase === "finished") return 1;
  if (!n) return 0;
  const { w, c } = sessionCursor(s);
  return Math.min(1, (w + c / s.words[w].length) / n);
}

/** Current word and how many of its letters are typed correctly (a typo stops the count). */
export function sessionCursor(s: TypingSession): { w: number; c: number } {
  const n = s.words.length;
  if (!n) return { w: 0, c: 0 };
  if (s.wordIndex >= n) return { w: n - 1, c: s.words[n - 1].length };
  const target = s.words[s.wordIndex];
  const typed = s.getTyped(s.wordIndex);
  let c = 0;
  while (c < typed.length && c < target.length && typed[c] === target[c]) c++;
  return { w: s.wordIndex, c };
}
