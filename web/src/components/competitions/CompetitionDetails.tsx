"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatRemaining } from "@/lib/competition";
import { formatDateTime, testLabel } from "@/lib/format";
import { errorMessage, useDeleteCompetitionMutation, useGetStandingsQuery } from "@/store/api";
import type { CompetitionDetail, CompetitionStatus } from "@/store/types";
import { dangerButtonCls, ghostButtonCls, linkCls } from "@/components/ui/states";
import { ShareButton } from "./ShareButton";
import { StatusBadge } from "./StatusBadge";

interface Props {
  comp: CompetitionDetail;
  status: CompetitionStatus;
  nowMs: number;
}

export function CompetitionDetails({ comp, status, nowMs }: Props) {
  const router = useRouter();
  const [remove, { isLoading: deleting, error: deleteError }] = useDeleteCompetitionMutation();
  const [confirming, setConfirming] = useState(false);
  // Shares the Standings list's polled cache, so the count stays live without extra requests.
  const { data: standings } = useGetStandingsQuery(comp.slug);
  const playerCount = standings?.playerCount ?? comp.playerCount;

  const timing =
    status === "upcoming"
      ? { label: "Starts in", value: formatRemaining(Date.parse(comp.startsAt) - nowMs) }
      : status === "live"
        ? { label: "Ends in", value: formatRemaining(Date.parse(comp.endsAt) - nowMs) }
        : { label: "Ended", value: formatDateTime(comp.endsAt) };

  const rows: [string, React.ReactNode][] = [
    ["Test", testLabel(comp.config)],
    ["Starts", formatDateTime(comp.startsAt)],
    ["Ends", formatDateTime(comp.endsAt)],
    ["Players", `${playerCount} / ${comp.maxPlayers}`],
    ["Attempts", comp.maxAttempts ? `${comp.maxAttempts} per player` : "Unlimited (best counts)"],
    ["Visibility", comp.visibility === "public" ? "Public" : "Link only"],
    [
      "Created by",
      <Link key="c" href={`/u/${comp.creator}`} className={linkCls}>
        {comp.creator}
      </Link>,
    ],
  ];

  return (
    <section aria-labelledby="comp-title" className="flex flex-col gap-4 rounded-surface border border-line bg-surface p-5">
      <div className="flex flex-col gap-2">
        <StatusBadge status={status} />
        <h1 id="comp-title" className="text-2xl font-semibold tracking-tight break-words text-text">
          {comp.title}
        </h1>
        {comp.description && <p className="text-sm break-words whitespace-pre-line text-sub">{comp.description}</p>}
      </div>

      <div aria-live="off">
        <div className="text-xs text-sub">{timing.label}</div>
        <div className="font-mono text-3xl tabular-nums text-main">{timing.value}</div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-sub">{k}</dt>
            <dd className="text-right break-words text-text">{v}</dd>
          </div>
        ))}
      </dl>

      {status !== "ended" && <ShareButton slug={comp.slug} title={comp.title} />}

      {comp.me?.isCreator && (
        <div className="border-t border-line pt-4">
          {confirming ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-text">Delete this competition for everyone? This can&apos;t be undone.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    const res = await remove(comp.slug);
                    if (!("error" in res)) router.replace("/competitions");
                  }}
                  className={dangerButtonCls}
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button type="button" onClick={() => setConfirming(false)} className={ghostButtonCls}>
                  Cancel
                </button>
              </div>
              {deleteError && <p className="text-sm text-error">{errorMessage(deleteError)}</p>}
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="rounded text-sm text-sub transition-colors hover:text-error focus-visible:outline-2 focus-visible:outline-main">
              Delete competition
            </button>
          )}
        </div>
      )}
    </section>
  );
}
