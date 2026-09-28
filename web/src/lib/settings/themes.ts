export interface Theme {
  id: string;
  name: string;
  scheme: "dark" | "light";
  /** CSS custom properties applied to <html>. */
  vars: Record<string, string>;
}

const theme = (
  id: string,
  name: string,
  scheme: "dark" | "light",
  c: {
    bg: string;
    bgAlt: string;
    sub: string;
    subAlt: string;
    text: string;
    main: string;
    caret?: string;
    error: string;
    errorExtra: string;
  },
): Theme => ({
  id,
  name,
  scheme,
  vars: {
    "--bg": c.bg,
    "--bg-alt": c.bgAlt,
    "--sub": c.sub,
    "--sub-alt": c.subAlt,
    "--text": c.text,
    "--main": c.main,
    "--caret": c.caret ?? c.main,
    "--error": c.error,
    "--error-extra": c.errorExtra,
  },
});

/**
 * Every `sub` (untyped text) color is picked for ≥4.5:1 against its `bg`.
 * The first entry must match the :root defaults in globals.css.
 */
export const THEMES: Theme[] = [
  theme("serika", "serika", "dark", {
    bg: "#1e1f22", bgAlt: "#2a2c30", sub: "#8a8d93", subAlt: "#3a3d42",
    text: "#d8d6cc", main: "#e2b714", error: "#f0616d", errorExtra: "#b3434f",
  }),
  theme("midnight", "midnight", "dark", {
    bg: "#0f172a", bgAlt: "#1e293b", sub: "#94a3b8", subAlt: "#334155",
    text: "#e2e8f0", main: "#38bdf8", error: "#f87171", errorExtra: "#b91c1c",
  }),
  theme("forest", "forest", "dark", {
    bg: "#1b2420", bgAlt: "#26332d", sub: "#8fa89a", subAlt: "#34453d",
    text: "#dfe8e1", main: "#7bd389", error: "#ff7a7a", errorExtra: "#b84a4a",
  }),
  theme("vampire", "vampire", "dark", {
    bg: "#282a36", bgAlt: "#343746", sub: "#9aa0c3", subAlt: "#44475a",
    text: "#f8f8f2", main: "#bd93f9", error: "#ff5555", errorExtra: "#b33b3b",
  }),
  theme("ember", "ember", "dark", {
    bg: "#221a17", bgAlt: "#30241f", sub: "#a8968c", subAlt: "#45352e",
    text: "#f2e6de", main: "#ff9e64", error: "#ff5f7e", errorExtra: "#b33a52",
  }),
  theme("matrix", "matrix", "dark", {
    bg: "#0b0f0b", bgAlt: "#142014", sub: "#5f9a66", subAlt: "#1f3322",
    text: "#b8f5bd", main: "#39ff6a", error: "#ff5c5c", errorExtra: "#b33a3a",
  }),
  theme("paper", "paper", "light", {
    bg: "#f5f3ee", bgAlt: "#e8e4da", sub: "#6b6862", subAlt: "#d4cfc3",
    text: "#2b2a28", main: "#b5520b", error: "#c62828", errorExtra: "#8e1c1c",
  }),
  theme("snow", "snow", "light", {
    bg: "#ffffff", bgAlt: "#eef0f3", sub: "#6a717b", subAlt: "#d5d9df",
    text: "#111418", main: "#2563eb", error: "#d32f2f", errorExtra: "#8b1f1f",
  }),
];

export const THEME_MAP: Record<string, Theme> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
);
