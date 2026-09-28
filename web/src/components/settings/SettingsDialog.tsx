"use client";

import { useRef, useState } from "react";
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
import { CloseIcon, SettingsIcon } from "@/components/ui/icons";
import { Row, Segmented, Switch, ThemePicker } from "./controls";

const opts = <T extends string>(list: readonly T[], labels?: Partial<Record<T, string>>) =>
  list.map((v) => ({ value: v, label: labels?.[v] ?? v.charAt(0).toUpperCase() + v.slice(1) }));

const SECTIONS = [
  { id: "appearance", label: "Appearance" },
  { id: "caret", label: "Caret" },
  { id: "sound", label: "Sound" },
  { id: "test", label: "While typing" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

export function SettingsDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const s = useSettings();
  const set = (patch: Partial<Settings>) => settingsStore.set(patch);
  const [section, setSection] = useState<SectionId>("appearance");

  const previewSound = (patch: Partial<Settings>) => {
    set(patch);
    const next = settingsStore.get();
    if (next.sound !== "off") playSound(next.sound, next.volume);
  };

  const current = SECTIONS.find((x) => x.id === section)!;

  return (
    <>
      <button
        type="button"
        aria-label="Settings"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-control p-2 text-sub transition-colors duration-150 hover:bg-surface hover:text-text focus-visible:text-text focus-visible:outline-2 focus-visible:outline-main active:bg-bg-alt"
      >
        <SettingsIcon className="size-4.5" />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="settings-title"
        onClick={(e) => {
          // Click on the backdrop (the dialog element itself) closes it.
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="m-auto w-full max-w-3xl overflow-hidden rounded-surface border border-line bg-bg p-0 text-text shadow-2xl backdrop:bg-black/60 max-sm:h-dvh max-sm:max-h-none max-sm:max-w-none max-sm:rounded-none"
      >
        <div className="flex h-[min(40rem,85dvh)] flex-col max-sm:h-full">
          <header className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 id="settings-title" className="text-xl font-semibold tracking-tight">
              Settings
            </h2>
            <button
              type="button"
              aria-label="Close settings"
              onClick={() => dialogRef.current?.close()}
              className="rounded-control p-2 text-sub transition-colors duration-150 hover:bg-surface hover:text-text focus-visible:outline-2 focus-visible:outline-main active:bg-bg-alt"
            >
              <CloseIcon />
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            <nav
              aria-label="Settings sections"
              className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-4 py-2 sm:w-44 sm:flex-col sm:border-r sm:border-b-0 sm:py-4"
            >
              {SECTIONS.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  aria-current={section === x.id ? "page" : undefined}
                  onClick={() => setSection(x.id)}
                  className={`shrink-0 rounded-control px-3 py-2 text-left text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-main ${
                    section === x.id ? "bg-bg-alt font-medium text-text" : "text-sub hover:bg-surface hover:text-text"
                  }`}
                >
                  {x.label}
                </button>
              ))}
            </nav>

            <section
              aria-label={current.label}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6"
            >
              {section === "appearance" && (
                <>
                  <div className="pt-4 pb-4">
                    <h3 id="s-theme" className="mb-3 text-sm font-medium text-sub">
                      Theme
                    </h3>
                    <ThemePicker themes={THEMES} value={s.theme} onChange={(theme) => set({ theme })} />
                  </div>
                  <Row title="Font size" description="Size of the words in the test.">
                    <Segmented
                      label="Font size"
                      value={s.fontSize}
                      options={opts(FONT_SIZES, { sm: "Small", md: "Medium", lg: "Large", xl: "Huge" })}
                      onChange={(fontSize) => set({ fontSize })}
                    />
                  </Row>
                </>
              )}

              {section === "caret" && (
                <>
                  <Row title="Caret style">
                    <Segmented label="Caret style" value={s.caretStyle} options={opts(CARET_STYLES)} onChange={(caretStyle) => set({ caretStyle })} />
                  </Row>
                  <Row title="Smooth caret" description="Caret glides between letters instead of jumping.">
                    <Switch label="Smooth caret" checked={s.smoothCaret} onChange={(smoothCaret) => set({ smoothCaret })} />
                  </Row>
                </>
              )}

              {section === "sound" && (
                <>
                  <Row title="Sound on keypress">
                    <Segmented label="Keypress sound" value={s.sound} options={opts(SOUNDS)} onChange={(sound) => previewSound({ sound })} />
                  </Row>
                  <Row title="Error sound" description="Short buzz when you hit a wrong key.">
                    <Switch
                      label="Error sound"
                      checked={s.errorSound}
                      onChange={(errorSound) => {
                        set({ errorSound });
                        if (errorSound) playSound("error", s.volume);
                      }}
                    />
                  </Row>
                  <Row title="Volume">
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
                </>
              )}

              {section === "test" && (
                <>
                  <Row title="Live WPM" description="Show speed while typing.">
                    <Switch label="Live WPM" checked={s.liveWpm} onChange={(liveWpm) => set({ liveWpm })} />
                  </Row>
                  <Row title="Live accuracy" description="Show accuracy while typing.">
                    <Switch label="Live accuracy" checked={s.liveAccuracy} onChange={(liveAccuracy) => set({ liveAccuracy })} />
                  </Row>
                  <Row title="Blind mode" description="Mistakes are still counted but not highlighted.">
                    <Switch label="Blind mode" checked={s.blindMode} onChange={(blindMode) => set({ blindMode })} />
                  </Row>
                </>
              )}
            </section>
          </div>

          <footer className="flex items-center justify-between gap-4 border-t border-line px-6 py-3">
            <p className="text-xs text-sub">Saved on this device automatically.</p>
            <button
              type="button"
              onClick={() => settingsStore.reset()}
              className="rounded-control px-3 py-1.5 text-sm text-sub transition-colors duration-150 hover:bg-surface hover:text-error focus-visible:outline-2 focus-visible:outline-main active:bg-bg-alt"
            >
              Reset to defaults
            </button>
          </footer>
        </div>
      </dialog>
    </>
  );
}
