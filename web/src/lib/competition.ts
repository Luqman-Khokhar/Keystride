import type { CompetitionStatus } from "@/store/types";

export const DURATIONS = [
  { minutes: 15, label: "15 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 360, label: "6 hours" },
  { minutes: 1440, label: "1 day" },
  { minutes: 4320, label: "3 days" },
  { minutes: 10080, label: "7 days" },
] as const;

export const ATTEMPT_CAPS = [null, 1, 3, 5, 10] as const;

export const STATUS_LABEL: Record<CompetitionStatus, string> = {
  live: "Live",
  upcoming: "Upcoming",
  ended: "Ended",
};

/** Status from the clock, so the page flips to live/ended without waiting for a refetch. */
export function statusAt(startsAt: string, endsAt: string, nowMs: number): CompetitionStatus {
  if (nowMs < Date.parse(startsAt)) return "upcoming";
  if (nowMs < Date.parse(endsAt)) return "live";
  return "ended";
}

/** "2d 4h", "3h 12m", "04:59" */
export function formatRemaining(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
