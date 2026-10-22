import type { IncomingHttpHeaders } from "node:http";

export type DeviceType = "mobile" | "tablet" | "desktop";

/** What a player raced on, as reported by their browser. Self-reported, so a signal, not proof. */
export interface Device {
  type: DeviceType;
  os: string;
  browser: string;
}

const header = (h: IncomingHttpHeaders, name: string) => {
  const v = h[name];
  return (Array.isArray(v) ? v[0] : v) ?? "";
};

/** `"Android"` from a structured client hint like `sec-ch-ua-platform: "Android"`. */
const unquote = (v: string) => v.trim().replace(/^"|"$/g, "");

/** Client-hint platforms we show as-is; anything else falls back to the UA string. */
const HINT_OS: Record<string, string> = {
  Android: "Android", iOS: "iOS", Windows: "Windows", macOS: "macOS", Linux: "Linux", "Chrome OS": "ChromeOS", ChromeOS: "ChromeOS",
};

function osOf(ua: string, hint: string): string {
  const platform = HINT_OS[unquote(hint)];
  if (platform) return platform;
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Other";
}

// Order matters: Edge, Opera and Samsung all also say "Chrome", and Chrome also says "Safari".
const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Safari\//, "Safari"],
];

function browserOf(ua: string): string {
  return BROWSERS.find(([re]) => re.test(ua))?.[1] ?? "Other";
}

function typeOf(ua: string, mobileHint: string): DeviceType {
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
  if (mobileHint === "?1" || /Mobi|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

/** Reads the device from request headers, preferring Chromium's client hints over the UA string. */
export function deviceFrom(headers: IncomingHttpHeaders): Device {
  const ua = header(headers, "user-agent").slice(0, 512);
  return {
    type: typeOf(ua, header(headers, "sec-ch-ua-mobile").trim()),
    os: osOf(ua, header(headers, "sec-ch-ua-platform").slice(0, 32)),
    browser: browserOf(ua),
  };
}
