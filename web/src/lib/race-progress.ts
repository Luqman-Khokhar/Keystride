import type { TypingSession } from "@/lib/engine/session";

/**
 * Share of the race text typed so far: whole words done plus the correct prefix of the
 * current word. A wrong letter holds the laser still until it's fixed.
 */
export function sessionProgress(s: TypingSession): number {
  const n = s.words.length;
  if (s.phase === "finished") return 1;
  if (!n) return 0;
  const i = Math.min(s.wordIndex, n - 1);
  const target = s.words[i];
  const typed = s.getTyped(i);
  let k = 0;
  while (k < typed.length && k < target.length && typed[k] === target[k]) k++;
  return Math.min(1, (s.wordIndex + k / target.length) / n);
}
