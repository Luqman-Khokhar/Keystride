import Link from "next/link";
import { formatRemaining, statusAt } from "@/lib/competition";
import { formatDate, testLabel } from "@/lib/format";
import type { CompetitionSummary } from "@/store/types";
import { StatusBadge } from "./StatusBadge";

export function CompetitionCard({ comp, nowMs }: { comp: CompetitionSummary; nowMs: number }) {
  const status = statusAt(comp.startsAt, comp.endsAt, nowMs);
  const timing =
    status === "live"
      ? `ends in ${formatRemaining(Date.parse(comp.endsAt) - nowMs)}`
      : status === "upcoming"
        ? `starts in ${formatRemaining(Date.parse(comp.startsAt) - nowMs)}`
        : `ended ${formatDate(comp.endsAt)}`;

  return (
    <li>
      <Link
        href={`/c/${comp.slug}`}
        className="flex h-full flex-col gap-3 rounded-lg bg-bg-alt p-4 transition-colors hover:bg-sub-alt focus-visible:outline-2 focus-visible:outline-main active:opacity-80"
      >
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={status} />
          <span className="text-xs tabular-nums text-sub">{timing}</span>
        </div>
        <span className="line-clamp-2 text-lg break-words text-text">{comp.title}</span>
        <span className="mt-auto flex flex-wrap gap-x-3 gap-y-1 text-xs text-sub">
          <span>{testLabel(comp.config)}</span>
          <span>
            {comp.playerCount}/{comp.maxPlayers} players
          </span>
          <span>by {comp.creator}</span>
          {comp.visibility === "unlisted" && <span>· link only</span>}
        </span>
      </Link>
    </li>
  );
}
