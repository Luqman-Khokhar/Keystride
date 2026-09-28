"use client";

import { useRef } from "react";
import {
  CARET_STYLES,
  FONT_SIZES,
  SOUNDS,
  settingsStore,
  type Settings,
} from "@/lib/settings/settings";
import { playSound } from "@/lib/settings/sound";
import { THEMES } from "@/lib/settings/themes";
import { useSettings } from "@/lib/settings/useSettings";
import { Row, Segmented, Switch, ThemePicker } from "./controls";

const opts = <T extends string>(list: readonly T[], labels?: Partial<Record<T, string>>) =>
  list.map((v) => ({ value: v, label: labels?.[v] ?? v }));

export function SettingsDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const s = useSettings();
  const set = (patch: Partial<Settings>) => settingsStore.set(patch);

  const previewSound = (patch: Partial<Settings>) => {
    set(patch);
    const next = settingsStore.get();
    if (next.sound !== "off") playSound(next.sound, next.volume);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Settings"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-lg p-2 text-sub transition-colors hover:text-text focus-visible:text-text focus-visible:outline-2 focus-visible:outline-main active:opacity-70"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="settings-title"
        onClick={(e) => {
          // Click on the backdrop (the dialog element itself) closes it.
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="m-auto w-full max-w-3xl overflow-hidden rounded-xl bg-bg p-0 text-text shadow-2xl backdrop:bg-black/60 max-sm:h-dvh max-sm:max-h-none max-sm:max-w-none max-sm:rounded-none"
      >
        <div className="flex max-h-[85dvh] flex-col max-sm:h-full max-sm:max-h-none">
          <header className="flex items-center justify-between px-6 pt-5 pb-3">
            <h2 id="settings-title" className="text-xl">
              settings
            </h2>
            <button
              type="button"
              aria-label="Close settings"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg p-2 text-sub transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-main active:opacity-70"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
            <section aria-labelledby="s-theme" className="pb-4">
              <h3 id="s-theme" className="mb-3 text-sm text-sub">
                theme
              </h3>
              <ThemePicker themes={THEMES} value={s.theme} onChange={(theme) => set({ theme })} />
            </section>

            <Row title="caret style">
              <Segmented label="Caret style" value={s.caretStyle} options={opts(CARET_STYLES)} onChange={(caretStyle) => set({ caretStyle })} />
            </Row>
            <Row title="smooth caret" description="Caret glides between letters instead of jumping.">
              <Switch label="Smooth caret" checked={s.smoothCaret} onChange={(smoothCaret) => set({ smoothCaret })} />
            </Row>
            <Row title="font size">
              <Segmented
                label="Font size"
                value={s.fontSize}
                options={opts(FONT_SIZES, { sm: "small", md: "medium", lg: "large", xl: "huge" })}
                onChange={(fontSize) => set({ fontSize })}
              />
            </Row>
            <Row title="sound on keypress">
              <Segmented label="Keypress sound" value={s.sound} options={opts(SOUNDS)} onChange={(sound) => previewSound({ sound })} />
            </Row>
            <Row title="error sound" description="Short buzz when you hit a wrong key.">
              <Switch
                label="Error sound"
                checked={s.errorSound}
                onChange={(errorSound) => {
                  set({ errorSound });
                  if (errorSound) playSound("error", s.volume);
                }}
              />
            </Row>
            <Row title="volume">
              <label className="flex items-center gap-3">
                <span className="sr-only">Volume</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(s.volume * 100)}
                  disabled={s.sound === "off" && !s.errorSound}
                  onChange={(e) => set({ volume: Number(e.target.value) / 100 })}
                  onPointerUp={() => {
                    const cur = settingsStore.get();
                    if (cur.sound !== "off") playSound(cur.sound, cur.volume);
                  }}
                  className="w-40 accent-main disabled:opacity-40"
                />
                <span className="w-10 text-right text-sm tabular-nums text-sub">{Math.round(s.volume * 100)}%</span>
              </label>
            </Row>
            <Row title="live wpm" description="Show speed while typing.">
              <Switch label="Live WPM" checked={s.liveWpm} onChange={(liveWpm) => set({ liveWpm })} />
            </Row>
            <Row title="live accuracy" description="Show accuracy while typing.">
              <Switch label="Live accuracy" checked={s.liveAccuracy} onChange={(liveAccuracy) => set({ liveAccuracy })} />
            </Row>
            <Row title="blind mode" description="Mistakes are still counted but not highlighted.">
              <Switch label="Blind mode" checked={s.blindMode} onChange={(blindMode) => set({ blindMode })} />
            </Row>

            <div className="flex justify-end border-t border-sub-alt pt-4">
              <button
                type="button"
                onClick={() => settingsStore.reset()}
                className="rounded-lg px-4 py-2 text-sm text-sub transition-colors hover:bg-bg-alt hover:text-error focus-visible:outline-2 focus-visible:outline-main active:opacity-70"
              >
                reset to defaults
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
