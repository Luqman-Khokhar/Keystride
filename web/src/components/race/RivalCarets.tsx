"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { TypingSession } from "@/lib/engine/session";

export interface Rival {
  username: string;
  /** 1–4: laser color. */
  color: number;
  w: number;
  c: number;
}

/**
 * Other racers' carets, placed on the same letters the player is reading. Rendered inside
 * the word list so they scroll with it; positioned straight on the DOM like the main caret,
 * so 10 updates a second never re-render the words.
 */
export function RivalCarets({ session, rivals }: { session: TypingSession; rivals: Rival[] }) {
  const layer = useRef<HTMLDivElement>(null);
  const carets = useRef(new Map<string, HTMLDivElement>());
  const latest = useRef(rivals);
  const frame = useRef(0);

  const layout = useCallback(() => {
    const container = layer.current?.parentElement;
    if (!container) return;
    for (const r of latest.current) {
      const el = carets.current.get(r.username);
      const wordEl = container.querySelector<HTMLElement>(`[data-i="${r.w}"]`);
      if (!el || !wordEl || !wordEl.children.length) continue;
      const letters = wordEl.children;
      let x: number;
      let y: number;
      if (r.c < letters.length) {
        const letter = letters[r.c] as HTMLElement;
        x = letter.offsetLeft;
        y = letter.offsetTop;
      } else {
        const letter = letters[letters.length - 1] as HTMLElement;
        x = letter.offsetLeft + letter.offsetWidth;
        y = letter.offsetTop;
      }
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, []);

  const schedule = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(layout);
  }, [layout]);

  useLayoutEffect(() => {
    latest.current = rivals;
    layout();
  }, [rivals, layout]);

  // The player's own extra letters and resizes shift where every word sits.
  useEffect(() => {
    const container = layer.current?.parentElement;
    const unsubscribe = session.subscribeCursor(schedule);
    const ro = container ? new ResizeObserver(schedule) : null;
    if (container) ro?.observe(container);
    return () => {
      unsubscribe();
      ro?.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [session, schedule]);

  return (
    <div ref={layer} aria-hidden="true" className="contents">
      {rivals.map((r) => (
        <div
          key={r.username}
          ref={(el) => {
            if (el) carets.current.set(r.username, el);
            else carets.current.delete(r.username);
          }}
          className="rival-caret"
          style={{ "--lane": `var(--lane-${r.color})` } as React.CSSProperties}
        >
          <span className="rival-tag">{r.username.charAt(0).toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}
