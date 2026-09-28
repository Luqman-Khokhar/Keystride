"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { TypingSession } from "@/lib/engine/session";
import { settingsStore } from "@/lib/settings/settings";
import { playSound } from "@/lib/settings/sound";
import { Word } from "./Word";

interface TypingAreaProps {
  session: TypingSession;
  /** Called with the input element so the parent can refocus after restart. */
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function TypingArea({ session, inputRef }: TypingAreaProps) {
  const words = useSyncExternalStore(session.subscribe, session.getWords, session.getWords);
  const phase = useSyncExternalStore(session.subscribe, session.getPhase, session.getPhase);

  const wordsRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const lineOffset = useRef(0);
  const composing = useRef(false);
  const [focused, setFocused] = useState(false);

  /** Positions caret and scrolls lines. Pure DOM work, no React state. */
  const layout = useCallback(() => {
    const container = wordsRef.current;
    const caret = caretRef.current;
    if (!container || !caret) return;

    const i = Math.min(session.wordIndex, session.words.length - 1);
    const wordEl = container.querySelector<HTMLElement>(`[data-i="${i}"]`);
    if (!wordEl) return;

    const letters = wordEl.children;
    const typedLen = session.wordIndex > i ? letters.length : session.getTyped(i).length;
    let x: number;
    let y: number;
    if (typedLen < letters.length) {
      const el = letters[typedLen] as HTMLElement;
      x = el.offsetLeft;
      y = el.offsetTop;
    } else {
      const el = letters[letters.length - 1] as HTMLElement;
      x = el.offsetLeft + el.offsetWidth;
      y = el.offsetTop;
    }

    // Keep the active word on the second visible line.
    const first = container.firstElementChild as HTMLElement | null;
    const step = first
      ? first.offsetHeight + parseFloat(getComputedStyle(container).rowGap || "0")
      : 0;
    if (step > 0) {
      const line = Math.round(wordEl.offsetTop / step);
      const offset = Math.max(0, line - 1) * step;
      if (offset !== lineOffset.current) {
        lineOffset.current = offset;
        container.style.transform = `translate3d(0, ${-offset}px, 0)`;
      }
    }

    caret.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, [session]);

  const scheduleLayout = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(layout);
  }, [layout]);

  // Reset scroll + caret whenever a new session mounts.
  useLayoutEffect(() => {
    lineOffset.current = 0;
    if (wordsRef.current) wordsRef.current.style.transform = "translate3d(0, 0, 0)";
    layout();
    return session.subscribeCursor(scheduleLayout);
  }, [session, layout, scheduleLayout]);

  // Keystroke sounds read settings directly — no React work per key.
  useEffect(
    () =>
      session.subscribeKeystroke((k) => {
        const { sound, volume, errorSound } = settingsStore.get();
        if (k.correct === false && errorSound) playSound("error", volume);
        else if (sound !== "off") playSound(sound, volume);
      }),
    [session],
  );

  // Font-size / theme changes reflow the text.
  useEffect(() => settingsStore.subscribe(scheduleLayout), [scheduleLayout]);

  // Word list growth or font/size changes reflow the text.
  useEffect(() => {
    scheduleLayout();
  }, [words, scheduleLayout]);

  useEffect(() => {
    const el = wordsRef.current;
    if (!el) return;
    const ro = new ResizeObserver(scheduleLayout);
    ro.observe(el);
    document.fonts?.ready.then(scheduleLayout);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [scheduleLayout]);

  // ---- input handling ------------------------------------------------------

  const applyValue = useCallback(
    (input: HTMLInputElement) => {
      const now = performance.now();
      const value = input.value;
      const space = value.indexOf(" ");
      if (space === -1) {
        session.setInput(value, now);
        return;
      }
      // Mobile keyboards deliver spaces (and autocorrected words) via input events.
      session.setInput(value.slice(0, space), now);
      session.commitWord(now);
      input.value = "";
    },
    [session],
  );

  const onInput = useCallback(
    (e: FormEvent<HTMLInputElement>) => {
      if (composing.current) return;
      applyValue(e.currentTarget);
    },
    [applyValue],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      if (e.key === " ") {
        e.preventDefault();
        if (session.commitWord(performance.now())) input.value = "";
        return;
      }
      if (e.key === "Backspace" && input.value === "") {
        const prev = session.backToPrevious();
        if (prev !== null) {
          e.preventDefault();
          if (e.ctrlKey || e.altKey || e.metaKey) {
            input.value = "";
            session.setInput("", performance.now());
          } else {
            input.value = prev;
          }
        }
      }
    },
    [session],
  );

  const focusInput = useCallback(() => inputRef.current?.focus(), [inputRef]);

  // Any printable key while unfocused jumps focus into the test.
  useEffect(() => {
    if (phase === "finished") return;
    const onWindowKey = (e: globalThis.KeyboardEvent) => {
      if (document.activeElement === inputRef.current) return;
      if (document.querySelector("dialog[open]")) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onWindowKey);
    return () => window.removeEventListener("keydown", onWindowKey);
  }, [phase, inputRef]);

  const showOverlay = !focused && phase !== "finished";

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        aria-label="Type the words shown"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="absolute left-0 top-0 h-px w-px opacity-0"
        onInput={onInput}
        onKeyDown={onKeyDown}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        onCompositionStart={() => (composing.current = true)}
        onCompositionEnd={(e) => {
          composing.current = false;
          applyValue(e.currentTarget);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      <div
        className={`words-window font-mono transition-[filter,opacity] duration-200 ${
          showOverlay ? "opacity-40 blur-xs" : ""
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          focusInput();
        }}
        aria-hidden="true"
      >
        <div ref={wordsRef} className="words">
          {words.map((w, i) => (
            <Word key={i} session={session} index={i} word={w} />
          ))}
          <div
            ref={caretRef}
            className={`caret ${phase === "idle" ? "blink" : ""} ${focused ? "" : "invisible"}`}
          />
        </div>
      </div>

      {showOverlay && (
        <button
          type="button"
          onClick={focusInput}
          className="absolute inset-0 flex items-center justify-center rounded-surface text-sm text-text focus-visible:outline-2 focus-visible:outline-main"
        >
          Click here or press any key to focus
        </button>
      )}
    </div>
  );
}
