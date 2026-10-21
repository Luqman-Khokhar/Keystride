"use client";

import { useEffect, useRef } from "react";
import type { ResultSubmission } from "@keystride/engine";
import { formatRaceTime } from "@/lib/race";
import { errorMessage, useSubmitAttemptMutation } from "@/store/api";
import { AlertIcon, ShieldAlertIcon } from "@/components/ui/icons";
import { buttonCls, Spinner } from "@/components/ui/states";

/** Submits this player's one race attempt and shows where they finished. */
export function RaceAttempt({ slug, submission }: { slug: string; submission: ResultSubmission }) {
  const [submit, { data, error, isLoading, isUninitialized, reset }] = useSubmitAttemptMutation();
  const sent = useRef<ResultSubmission | null>(null);

  useEffect(() => {
    // StrictMode runs effects twice in development; submit once.
    if (sent.current === submission) return;
    sent.current = submission;
    submit({ slug, submission });
  }, [slug, submission, submit]);

  let content: React.ReactNode;
  if (isLoading || isUninitialized) content = <Spinner label="Checking your run…" />;
  else if (error) {
    content = (
      <div className="flex flex-col items-center gap-3 text-error">
        <p className="flex items-center gap-1.5">
          <AlertIcon className="size-4" />
          {errorMessage(error, "Couldn't submit your run")}
        </p>
        <button
          type="button"
          onClick={() => {
            reset();
            submit({ slug, submission });
          }}
          className={buttonCls}
        >
          Retry
        </button>
      </div>
    );
  } else if (data?.race) {
    content = (
      <div className="flex flex-col items-center gap-1">
        <p className="font-mono text-5xl text-main">#{data.race.place}</p>
        <p className="text-sub">
          Finished in <span className="text-text">{formatRaceTime(data.race.finishMs)}</span> ·{" "}
          {Math.round(data.wpm)} wpm · {Math.round(data.accuracy)}%
        </p>
      </div>
    );
  } else if (data) {
    content = (
      <p className="flex items-center gap-1.5 text-sub">
        <ShieldAlertIcon className="size-4" />
        Recorded but not counted{data.flagReason ? `: ${data.flagReason}` : ""}.
      </p>
    );
  }

  return (
    <section
      aria-live="polite"
      className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-surface border border-line px-6 py-8 text-center"
    >
      {content}
      {data && <p className="text-xs text-sub">Waiting for the others to cross the line…</p>}
    </section>
  );
}
