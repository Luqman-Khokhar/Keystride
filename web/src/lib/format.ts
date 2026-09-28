import type { TestConfig } from "@keystride/engine";

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const dateTimeFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

const relFmt = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const REL_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.35],
  ["month", 12],
  ["year", Infinity],
];

/** "3 minutes ago", "yesterday", "2 weeks ago". */
export function formatRelative(iso: string, nowMs = Date.now()): string {
  let v = (Date.parse(iso) - nowMs) / 1000;
  for (const [unit, size] of REL_STEPS) {
    if (Math.abs(v) < size) return relFmt.format(Math.round(v), unit);
    v /= size;
  }
  return formatDate(iso);
}

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function testLabel(c: Pick<TestConfig, "mode" | "amount" | "punctuation" | "numbers">): string {
  const extras = [c.punctuation && "punctuation", c.numbers && "numbers"].filter(Boolean);
  return `${c.mode} ${c.amount}${extras.length ? ` · ${extras.join(" · ")}` : ""}`;
}

/** Only allow same-site relative redirects (blocks open redirects like //evil.com). */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
