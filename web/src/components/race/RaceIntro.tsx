"use client";

import Link from "next/link";
import { useGetMeQuery } from "@/store/api";
import { RACE_PLAYER_OPTIONS, RACE_WORD_OPTIONS } from "@/lib/race";
import { primaryButtonCls } from "@/components/ui/states";
import { FlagIcon } from "@/components/ui/icons";

const MAX_PLAYERS = RACE_PLAYER_OPTIONS[RACE_PLAYER_OPTIONS.length - 1];

const STEPS = [
  ["Create a lobby", `Pick ${RACE_WORD_OPTIONS.join(", ")} words, up to ${MAX_PLAYERS} players and a track style.`],
  ["Share the link", "Send the invite link. Friends join your lobby and wait for you."],
  ["Race", "Press start. After a short countdown everyone types the same text at the same time."],
] as const;

const RULES = [
  ["Live", "Everyone races at the same moment, so make sure your friends are online."],
  ["Strict words", "Each word must be typed correctly before you can move on to the next one."],
  ["One attempt", "Every player gets a single run. First to finish wins."],
  ["Rematch", "When the race ends, start a rematch and the whole lobby moves to a new race."],
  ["Account", "Hosting and joining a race need a free account."],
] as const;

export function RaceIntro() {
  const { data: user } = useGetMeQuery();
  const startHref = user ? "/competitions/race" : "/login?next=/competitions/race";

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Race your friends</h1>
          <p className="text-sm text-sub">Live typing races on the same text. Watch everyone&apos;s progress as you type.</p>
        </div>
        <Link href={startHref} className={primaryButtonCls}>
          <FlagIcon className="size-4" />
          Start a race
        </Link>
      </div>

      <section aria-labelledby="race-how" className="flex flex-col gap-3">
        <h2 id="race-how" className="font-medium text-text">How it works</h2>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex gap-3 rounded-surface border border-line p-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-main-soft font-mono text-sm text-main">
                {i + 1}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-medium text-text">{title}</span>
                <span className="text-sm text-sub">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="race-rules" className="flex flex-col gap-3">
        <h2 id="race-rules" className="font-medium text-text">Good to know</h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-surface border border-line p-4 sm:grid-cols-[max-content_1fr]">
          {RULES.map(([term, desc]) => (
            <div key={term} className="contents">
              <dt className="text-sm font-medium text-text">{term}</dt>
              <dd className="-mt-2 text-sm text-sub sm:mt-0">{desc}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
