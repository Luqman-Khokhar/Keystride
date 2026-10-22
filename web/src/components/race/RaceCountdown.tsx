"use client";

/** 5-4-3-2-1 before the text unlocks. */
export function RaceCountdown({ msLeft }: { msLeft: number }) {
  const seconds = Math.max(1, Math.ceil(msLeft / 1000));
  return (
    <section
      aria-labelledby="countdown-title"
      className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-surface border border-line bg-surface px-6 py-10 text-center"
    >
      <h2 id="countdown-title" className="text-sm font-medium text-sub">
        Get ready
      </h2>
      <p
        key={seconds}
        aria-live="assertive"
        className="animate-[race-pop_var(--dur-slow)_var(--ease-soft)] font-mono text-7xl text-main tabular-nums motion-reduce:animate-none sm:text-8xl"
      >
        {seconds}
      </p>
      <p className="text-sm text-sub">The text unlocks at zero. Keep your fingers on the home row.</p>
      <p className="text-xs text-sub">Type each word correctly to move on to the next. One attempt, first to finish wins.</p>
    </section>
  );
}
