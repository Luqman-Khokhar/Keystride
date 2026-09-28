"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { TypingSession } from "@/lib/engine/session";
import { useSettings } from "@/lib/settings/useSettings";

interface LiveCounterProps {
  session: TypingSession;
}

interface Display {
  counter: number;
  wpm: number;
  acc: number;
}

/**
 * Time mode: countdown, and ends the test on time.
 * Words mode: "typed / total" counter.
 * Optional live wpm / accuracy. Isolated so its ticks never re-render the word list.
 */
export function LiveCounter({ session }: LiveCounterProps) {
  const phase = useSyncExternalStore(session.subscribe, session.getPhase, session.getPhase);
  const { liveWpm, liveAccuracy } = useSettings();
  const { mode, amount } = session.config;
  const [display, setDisplay] = useState<Display>({
    counter: mode === "time" ? amount : 0,
    wpm: 0,
    acc: 100,
  });

  useEffect(() => {
    if (phase !== "running") return;
    let last: Display = { counter: -1, wpm: -1, acc: -1 };
    let lastStatsAt = 0;
    const tick = () => {
      const now = performance.now();
      let counter: number;
      if (mode === "time") {
        const elapsed = session.elapsed(now);
        if (elapsed >= amount * 1000) {
          session.finish(now);
          return;
        }
        counter = Math.ceil(amount - elapsed / 1000);
      } else {
        counter = session.wordIndex;
      }

      let { wpm, acc } = last;
      // Live stats refresh 4×/s — fast enough to feel live, calm enough to read.
      if ((liveWpm || liveAccuracy) && now - lastStatsAt >= 250) {
        lastStatsAt = now;
        const s = session.liveStats(now);
        wpm = Math.round(s.wpm);
        acc = Math.floor(s.accuracy);
      }

      if (counter !== last.counter || wpm !== last.wpm || acc !== last.acc) {
        last = { counter, wpm, acc };
        setDisplay(last);
      }
    };
    tick();
    const id = window.setInterval(tick, 50);
    return () => window.clearInterval(id);
  }, [phase, mode, amount, session, liveWpm, liveAccuracy]);

  const running = phase === "running";
  const counter =
    mode === "time"
      ? `${running ? display.counter : amount}`
      : `${running ? display.counter : 0}/${amount}`;

  return (
    <div
      className={`flex h-8 items-baseline gap-6 text-2xl tabular-nums text-main transition-opacity duration-200 ${
        running ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!running}
    >
      <span>{counter}</span>
      {liveWpm && (
        <span>
          {running && display.wpm >= 0 ? display.wpm : 0}
          <span className="ml-1 text-sm text-sub">wpm</span>
        </span>
      )}
      {liveAccuracy && (
        <span>
          {running && display.acc >= 0 ? display.acc : 100}
          <span className="ml-1 text-sm text-sub">%</span>
        </span>
      )}
    </div>
  );
}
