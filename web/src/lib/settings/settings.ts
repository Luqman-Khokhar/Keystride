import { THEME_MAP, type Theme } from "./themes";

export const CARET_STYLES = ["line", "block", "underline", "off"] as const;
export const FONT_SIZES = ["sm", "md", "lg", "xl"] as const;
export const SOUNDS = ["off", "click", "soft", "typewriter"] as const;

export type CaretStyle = (typeof CARET_STYLES)[number];
export type FontSize = (typeof FONT_SIZES)[number];
export type SoundKind = (typeof SOUNDS)[number];

export interface Settings {
  theme: string;
  caretStyle: CaretStyle;
  smoothCaret: boolean;
  fontSize: FontSize;
  sound: SoundKind;
  /** 0–1 */
  volume: number;
  errorSound: boolean;
  liveWpm: boolean;
  liveAccuracy: boolean;
  blindMode: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "serika",
  caretStyle: "line",
  smoothCaret: true,
  fontSize: "md",
  sound: "off",
  volume: 0.5,
  errorSound: false,
  liveWpm: false,
  liveAccuracy: false,
  blindMode: false,
};

const STORAGE_KEY = "ks:settings";

function oneOf<T extends string>(list: readonly T[], v: unknown, fallback: T): T {
  return list.includes(v as T) ? (v as T) : fallback;
}

function sanitize(raw: Partial<Settings>): Settings {
  const d = DEFAULT_SETTINGS;
  const vol = Number(raw.volume);
  return {
    theme: typeof raw.theme === "string" && THEME_MAP[raw.theme] ? raw.theme : d.theme,
    caretStyle: oneOf(CARET_STYLES, raw.caretStyle, d.caretStyle),
    smoothCaret: typeof raw.smoothCaret === "boolean" ? raw.smoothCaret : d.smoothCaret,
    fontSize: oneOf(FONT_SIZES, raw.fontSize, d.fontSize),
    sound: oneOf(SOUNDS, raw.sound, d.sound),
    volume: Number.isFinite(vol) ? Math.min(1, Math.max(0, vol)) : d.volume,
    errorSound: typeof raw.errorSound === "boolean" ? raw.errorSound : d.errorSound,
    liveWpm: typeof raw.liveWpm === "boolean" ? raw.liveWpm : d.liveWpm,
    liveAccuracy: typeof raw.liveAccuracy === "boolean" ? raw.liveAccuracy : d.liveAccuracy,
    blindMode: typeof raw.blindMode === "boolean" ? raw.blindMode : d.blindMode,
  };
}

/**
 * Writes settings onto <html> as CSS variables + data attributes.
 * Self-contained (no outer references) because it is also serialized
 * into the pre-paint boot script.
 */
export function applySettings(
  root: HTMLElement,
  s: Settings,
  themes: Record<string, Theme>,
) {
  const t = themes[s.theme] || themes.serika;
  for (const k in t.vars) root.style.setProperty(k, t.vars[k]);
  root.style.colorScheme = t.scheme;
  root.dataset.theme = t.id;
  root.dataset.caret = s.caretStyle;
  root.dataset.smoothCaret = s.smoothCaret ? "on" : "off";
  root.dataset.fontSize = s.fontSize;
  root.dataset.blind = s.blindMode ? "on" : "off";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t.vars["--bg"]);
}

/** Inline script for <head>: applies saved settings before first paint. */
export const SETTINGS_BOOT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"{}")||{};var d=${JSON.stringify(DEFAULT_SETTINGS)};for(var k in d)if(!(k in s))s[k]=d[k];(${applySettings.toString()})(document.documentElement,s,${JSON.stringify(
  THEME_MAP,
)});}catch(e){}})()`;

// ---- store -----------------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();
let current: Settings | null = null;

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const settingsStore = {
  get(): Settings {
    if (current === null) current = typeof window === "undefined" ? DEFAULT_SETTINGS : load();
    return current;
  },
  getServer(): Settings {
    return DEFAULT_SETTINGS;
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  set(patch: Partial<Settings>) {
    current = sanitize({ ...settingsStore.get(), ...patch });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Storage unavailable — settings apply for this visit only.
    }
    applySettings(document.documentElement, current, THEME_MAP);
    listeners.forEach((fn) => fn());
  },
  reset() {
    settingsStore.set(DEFAULT_SETTINGS);
  },
};
