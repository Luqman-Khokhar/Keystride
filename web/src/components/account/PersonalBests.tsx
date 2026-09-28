import { TIME_OPTIONS, WORD_OPTIONS } from "@keystride/engine";
import { formatDate } from "@/lib/format";
import type { PersonalBest } from "@/store/types";

/** Grid of standard (no punctuation/numbers) PBs for every test length, "–" when missing. */
export function PersonalBests({ bests }: { bests: PersonalBest[] }) {
  const standard = bests.filter((b) => !b.config.punctuation && !b.config.numbers);
  const find = (mode: "time" | "words", amount: number) =>
    standard.find((b) => b.config.mode === mode && b.config.amount === amount);

  // The single fastest standard result gets the accent.
  const top = standard.reduce<PersonalBest | undefined>((a, b) => (!a || b.wpm > a.wpm ? b : a), undefined);

  const groups = [
    { mode: "time" as const, amounts: TIME_OPTIONS, unit: "seconds" },
    { mode: "words" as const, amounts: WORD_OPTIONS, unit: "words" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {groups.map((g) => (
        <section key={g.mode} aria-labelledby={`pb-${g.mode}`} className="rounded-surface border border-line bg-surface p-4">
          <h3 id={`pb-${g.mode}`} className="mb-3 text-sm font-medium text-sub">
            {g.mode === "time" ? "Timed tests" : "Word-count tests"}
          </h3>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {g.amounts.map((a) => {
              const pb = find(g.mode, a);
              const isTop = !!pb && pb === top;
              return (
                <div
                  key={a}
                  title={pb ? `${pb.wpm} wpm · ${pb.accuracy}% acc · ${formatDate(pb.createdAt)}` : undefined}
                  className={isTop ? "-m-2 rounded-control bg-main-soft p-2" : undefined}
                >
                  <dt className="text-xs text-sub">
                    {a} {g.unit}
                    {isTop && <span className="ml-1 text-main">· fastest</span>}
                  </dt>
                  <dd className={`font-mono text-2xl tabular-nums ${isTop ? "text-main" : pb ? "text-text" : "text-sub"}`}>
                    {pb ? Math.round(pb.wpm) : "–"}
                  </dd>
                  <dd className="text-xs tabular-nums text-sub">{pb ? `${Math.round(pb.accuracy)}%` : "No result"}</dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
