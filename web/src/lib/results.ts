import { PRESETS } from "./presets";
import { apiGet } from "./site";
import type { PublicResult } from "@/store/types";

export const isResultId = (id: string) => /^[a-f0-9]{24}$/.test(id);

export async function getPublicResult(id: string): Promise<PublicResult | null> {
  return isResultId(id) ? apiGet<PublicResult>(`/results/${id}`, 300) : null;
}

/** Landing page for the same test settings, so "beat this score" opens the right mode. */
export function presetPathFor(r: Pick<PublicResult, "mode" | "amount" | "punctuation" | "numbers">): string {
  const p = PRESETS.find(
    (x) =>
      x.config.mode === r.mode &&
      x.config.amount === r.amount &&
      x.config.punctuation === r.punctuation &&
      x.config.numbers === r.numbers,
  );
  return p ? `/typing-test/${p.slug}` : "/";
}
